/**
 * レシピ画像の Storage アップロード／差し替え／削除ロジック。
 *
 * 画像本体は非公開 `photos` バケットに置き、DB（`recipes.image_storage_path`）には Storage path だけを保存する。
 * 公開URLは保存しない。差し替え・削除時は古い Storage object を後始末する。
 *
 * Supabase クライアントの最小インターフェースだけに依存させ、ユニットテストしやすくする。
 * 例外は投げず、`{ ok, error?, path? }` 形式で結果を返す（呼び出し側が UI フィードバックを出す）。
 */

import { buildRecipeImageStoragePath, imageExtensionFromContentType, type CompressedPhoto } from "@/lib/photos/compress";
import { PHOTOS_BUCKET } from "@/lib/photos/user-image";
import { buildYoutubeThumbnailCandidateUrls } from "@/lib/youtube";

type StorageBucketApi = {
  copy?: (fromPath: string, toPath: string) => Promise<{ error: { message: string } | null }>;
  download?: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
  upload: (path: string, body: Blob, options?: { contentType?: string; cacheControl?: string; upsert?: boolean }) => Promise<{ error: { message: string } | null }>;
  remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
};

type RecipeUpdateResult = { error: { message: string } | null };

/** upload／remove と recipes 更新だけに依存する最小クライアント。 */
export type RecipeImageClient = {
  storage: { from: (bucket: string) => StorageBucketApi };
  from: (table: "recipes") => {
    update: (values: { image_storage_path: string | null }) => {
      eq: (column: "id" | "user_id", value: string) => {
        // Supabase の FilterBuilder は thenable（await で結果が解決される）。
        eq: (column: "id" | "user_id", value: string) => PromiseLike<RecipeUpdateResult>;
      };
    };
  };
};

export type RecipeImageUploadResult =
  | { ok: true; storagePath: string; staleRemovalFailed: boolean }
  | { ok: false; error: string };

export type RecipeImageDeleteResult = { ok: true; staleRemovalFailed: boolean } | { ok: false; error: string };
export type YoutubeThumbnailFetchResult = { ok: true; blob: Blob; contentType: YoutubeThumbnailContentType } | { ok: false; error: string };

const UPLOAD_ERROR =
  "原因: レシピ画像をStorageへ保存できませんでした。影響: 画像は登録されません。修正方法: 別の画像を選び直し、ログイン状態と通信を確認してください。";
const DB_UPDATE_ERROR =
  "原因: レシピ画像の保存先をDBへ反映できませんでした。影響: アップロードした画像が表示されません。修正方法: 画面を再読み込みし、もう一度保存してください。";
const DB_CLEAR_ERROR =
  "原因: レシピ画像の削除をDBへ反映できませんでした。影響: 画像が残ったままになります。修正方法: 画面を再読み込みし、もう一度削除してください。";
const COPY_ERROR =
  "原因: 過去の完成写真をコピーできませんでした。影響: レシピ画像は登録されません。修正方法: 通信状態を確認して、もう一度選び直してください。";
const YOUTUBE_THUMBNAIL_FETCH_ERROR =
  "原因: YouTubeサムネイル画像を取得できませんでした。影響: レシピ画像は自動登録されません。修正方法: YouTube URLを確認するか、手動で画像を登録してください。";
const YOUTUBE_THUMBNAIL_TYPE_ERROR =
  "原因: YouTubeサムネイルが許可された画像形式ではありません。影響: レシピ画像は自動登録されません。修正方法: 手動で画像を登録してください。";
const YOUTUBE_THUMBNAIL_SIZE_ERROR =
  "原因: YouTubeサムネイル画像のサイズが大きすぎます。影響: レシピ画像は自動登録されません。修正方法: 手動で画像を登録してください。";

const YOUTUBE_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
const YOUTUBE_THUMBNAIL_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type YoutubeThumbnailContentType = (typeof YOUTUBE_THUMBNAIL_CONTENT_TYPES)[number];
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function extensionFromStoragePath(storagePath: string) {
  const rawExtension = storagePath.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp"].includes(rawExtension) ? (rawExtension === "jpeg" ? "jpg" : rawExtension) : "webp";
}

function youtubeThumbnailExtensionFromContentType(contentType: YoutubeThumbnailContentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function normalizeYoutubeThumbnailContentType(contentType: string | null): YoutubeThumbnailContentType | null {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  return YOUTUBE_THUMBNAIL_CONTENT_TYPES.includes(normalized as YoutubeThumbnailContentType) ? (normalized as YoutubeThumbnailContentType) : null;
}

function contentLengthExceedsLimit(response: Response, maxBytes: number) {
  const rawLength = response.headers.get("content-length");
  if (!rawLength) return false;
  const parsed = Number(rawLength);
  return Number.isFinite(parsed) && parsed > maxBytes;
}

export async function fetchYoutubeThumbnailImage(
  videoId: string,
  options?: { fetcher?: FetchLike; maxBytes?: number }
): Promise<YoutubeThumbnailFetchResult> {
  const candidates = buildYoutubeThumbnailCandidateUrls(videoId);
  if (candidates.length === 0) {
    return { ok: false, error: YOUTUBE_THUMBNAIL_FETCH_ERROR };
  }

  const fetcher = options?.fetcher ?? globalThis.fetch.bind(globalThis);
  const maxBytes = options?.maxBytes ?? YOUTUBE_THUMBNAIL_MAX_BYTES;

  for (const url of candidates) {
    let response: Response;
    try {
      response = await fetcher(url, { redirect: "error" });
    } catch {
      continue;
    }

    if (!response.ok) {
      continue;
    }

    const contentType = normalizeYoutubeThumbnailContentType(response.headers.get("content-type"));
    if (!contentType) {
      return { ok: false, error: YOUTUBE_THUMBNAIL_TYPE_ERROR };
    }

    if (contentLengthExceedsLimit(response, maxBytes)) {
      return { ok: false, error: YOUTUBE_THUMBNAIL_SIZE_ERROR };
    }

    const blob = await response.blob();
    if (blob.size > maxBytes) {
      return { ok: false, error: YOUTUBE_THUMBNAIL_SIZE_ERROR };
    }

    return { ok: true, blob, contentType };
  }

  return { ok: false, error: YOUTUBE_THUMBNAIL_FETCH_ERROR };
}

export async function copyPhotoStorageObject(
  client: RecipeImageClient,
  params: { contentType?: string | null; fromPath: string; toPath: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bucket = client.storage.from(PHOTOS_BUCKET);
  if (bucket.copy) {
    const { error } = await bucket.copy(params.fromPath, params.toPath);
    if (!error) return { ok: true };
  }

  if (!bucket.download) {
    return { ok: false, error: COPY_ERROR };
  }

  const { data, error: downloadError } = await bucket.download(params.fromPath);
  if (downloadError || !data) {
    return { ok: false, error: COPY_ERROR };
  }

  const { error: uploadError } = await bucket.upload(params.toPath, data, {
    contentType: params.contentType || data.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false
  });
  if (uploadError) {
    return { ok: false, error: COPY_ERROR };
  }

  return { ok: true };
}

/**
 * 画像をアップロードし、`recipes.image_storage_path` を更新する。
 * 差し替え時（`previousPath` あり）は、新規 upload と DB 更新の成功後に古い object を削除する。
 * 古い object の削除に失敗しても処理自体は成功扱いとし、`staleRemovalFailed` で呼び出し側に伝える
 * （表示は新しい画像に切り替わり済みで、残るのは不要ファイルのみ）。
 */
export async function uploadRecipeImage(
  client: RecipeImageClient,
  params: { userId: string; recipeId: string; compressed: CompressedPhoto; previousPath?: string | null }
): Promise<RecipeImageUploadResult> {
  const { userId, recipeId, compressed, previousPath } = params;
  const extension = imageExtensionFromContentType(compressed.contentType);
  const storagePath = buildRecipeImageStoragePath(userId, recipeId, extension);

  const { error: uploadError } = await client.storage.from(PHOTOS_BUCKET).upload(storagePath, compressed.blob, {
    contentType: compressed.contentType,
    cacheControl: "31536000",
    upsert: false
  });
  if (uploadError) {
    return { ok: false, error: UPLOAD_ERROR };
  }

  const { error: updateError } = await client
    .from("recipes")
    .update({ image_storage_path: storagePath })
    .eq("id", recipeId)
    .eq("user_id", userId);
  if (updateError) {
    // DB 更新に失敗したので、いまアップロードした孤児 object を後始末する（残しても表示には使われない）。
    await client.storage.from(PHOTOS_BUCKET).remove([storagePath]);
    return { ok: false, error: DB_UPDATE_ERROR };
  }

  let staleRemovalFailed = false;
  if (previousPath && previousPath !== storagePath) {
    const { error: removeError } = await client.storage.from(PHOTOS_BUCKET).remove([previousPath]);
    staleRemovalFailed = Boolean(removeError);
  }

  return { ok: true, storagePath, staleRemovalFailed };
}

export async function setRecipeImageFromCandidate(
  client: RecipeImageClient,
  params: { userId: string; recipeId: string; candidatePath: string; candidateContentType?: string | null; previousPath?: string | null }
): Promise<RecipeImageUploadResult> {
  const { userId, recipeId, candidatePath, candidateContentType, previousPath } = params;
  const extension = candidateContentType ? imageExtensionFromContentType(candidateContentType) : extensionFromStoragePath(candidatePath);
  const storagePath = buildRecipeImageStoragePath(userId, recipeId, extension);

  const copyResult = await copyPhotoStorageObject(client, {
    contentType: candidateContentType,
    fromPath: candidatePath,
    toPath: storagePath
  });
  if (!copyResult.ok) {
    return { ok: false, error: copyResult.error };
  }

  const { error: updateError } = await client
    .from("recipes")
    .update({ image_storage_path: storagePath })
    .eq("id", recipeId)
    .eq("user_id", userId);
  if (updateError) {
    await client.storage.from(PHOTOS_BUCKET).remove([storagePath]);
    return { ok: false, error: DB_UPDATE_ERROR };
  }

  let staleRemovalFailed = false;
  if (previousPath && previousPath !== storagePath) {
    const { error: removeError } = await client.storage.from(PHOTOS_BUCKET).remove([previousPath]);
    staleRemovalFailed = Boolean(removeError);
  }

  return { ok: true, storagePath, staleRemovalFailed };
}

export async function setRecipeImageFromYoutubeThumbnail(
  client: RecipeImageClient,
  params: {
    userId: string;
    recipeId: string;
    videoId: string;
    previousPath?: string | null;
    fetcher?: FetchLike;
    maxBytes?: number;
  }
): Promise<RecipeImageUploadResult> {
  const { userId, recipeId, videoId, previousPath, fetcher, maxBytes } = params;
  const thumbnail = await fetchYoutubeThumbnailImage(videoId, { fetcher, maxBytes });
  if (!thumbnail.ok) {
    return { ok: false, error: thumbnail.error };
  }

  const extension = youtubeThumbnailExtensionFromContentType(thumbnail.contentType);
  const storagePath = buildRecipeImageStoragePath(userId, recipeId, extension);

  const { error: uploadError } = await client.storage.from(PHOTOS_BUCKET).upload(storagePath, thumbnail.blob, {
    contentType: thumbnail.contentType,
    cacheControl: "31536000",
    upsert: false
  });
  if (uploadError) {
    return { ok: false, error: UPLOAD_ERROR };
  }

  const { error: updateError } = await client
    .from("recipes")
    .update({ image_storage_path: storagePath })
    .eq("id", recipeId)
    .eq("user_id", userId);
  if (updateError) {
    await client.storage.from(PHOTOS_BUCKET).remove([storagePath]);
    return { ok: false, error: DB_UPDATE_ERROR };
  }

  let staleRemovalFailed = false;
  if (previousPath && previousPath !== storagePath) {
    const { error: removeError } = await client.storage.from(PHOTOS_BUCKET).remove([previousPath]);
    staleRemovalFailed = Boolean(removeError);
  }

  return { ok: true, storagePath, staleRemovalFailed };
}

/**
 * `recipes.image_storage_path` を null に戻し、対象 Storage object を削除する。
 * DB 更新を先に行い、成功後に Storage を片付ける（DB が正なので、表示は確実にフォールバックへ戻る）。
 */
export async function deleteRecipeImage(
  client: RecipeImageClient,
  params: { userId: string; recipeId: string; storagePath: string }
): Promise<RecipeImageDeleteResult> {
  const { userId, recipeId, storagePath } = params;

  const { error: updateError } = await client
    .from("recipes")
    .update({ image_storage_path: null })
    .eq("id", recipeId)
    .eq("user_id", userId);
  if (updateError) {
    return { ok: false, error: DB_CLEAR_ERROR };
  }

  const { error: removeError } = await client.storage.from(PHOTOS_BUCKET).remove([storagePath]);
  return { ok: true, staleRemovalFailed: Boolean(removeError) };
}
