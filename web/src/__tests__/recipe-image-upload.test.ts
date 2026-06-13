import { describe, expect, it, vi } from "vitest";
import {
  deleteRecipeImage,
  fetchYoutubeThumbnailImage,
  setRecipeImageFromCandidate,
  setRecipeImageFromYoutubeThumbnail,
  uploadRecipeImage,
  type RecipeImageClient
} from "@/lib/photos/recipe-image-upload";
import type { CompressedPhoto } from "@/lib/photos/compress";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const RECIPE_ID = "recipe-1";

const compressed: CompressedPhoto = {
  blob: new Blob(["x"], { type: "image/webp" }),
  byteSize: 1,
  contentType: "image/webp",
  height: 720,
  width: 960
};

type StorageError = { message: string } | null;

function makeClient(options?: {
  uploadError?: StorageError;
  copyError?: StorageError;
  downloadError?: StorageError;
  removeError?: StorageError;
  updateError?: StorageError;
}) {
  const copy = vi.fn<(fromPath: string, toPath: string) => Promise<{ error: StorageError }>>(async () => ({ error: options?.copyError ?? null }));
  const download = vi.fn<(path: string) => Promise<{ data: Blob | null; error: StorageError }>>(async () => ({
    data: options?.downloadError ? null : new Blob(["candidate"], { type: "image/jpeg" }),
    error: options?.downloadError ?? null
  }));
  const upload = vi.fn<(path: string, body: Blob, opts?: { contentType?: string; cacheControl?: string; upsert?: boolean }) => Promise<{ error: StorageError }>>(
    async () => ({ error: options?.uploadError ?? null })
  );
  const remove = vi.fn<(paths: string[]) => Promise<{ error: StorageError }>>(async () => ({ error: options?.removeError ?? null }));
  const update = vi.fn(() => ({
    eq: () => ({
      eq: async () => ({ error: options?.updateError ?? null })
    })
  }));
  const storageFrom = vi.fn(() => ({ copy, download, upload, remove }));
  const client = {
    storage: { from: storageFrom },
    from: vi.fn(() => ({ update }))
  } as unknown as RecipeImageClient;
  return { client, copy, download, upload, remove, update, storageFrom };
}

describe("uploadRecipeImage", () => {
  it("非公開 photos バケットへ <user_id>/recipe-images/<recipe_id>/ 配下に upload し DB path を更新する", async () => {
    const { client, upload, update, storageFrom } = makeClient();
    const result = await uploadRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, compressed });

    expect(result.ok).toBe(true);
    expect(storageFrom).toHaveBeenCalledWith("photos");
    const uploadedPath = upload.mock.calls[0][0] as string;
    expect(uploadedPath.startsWith(`${USER_ID}/recipe-images/${RECIPE_ID}/`)).toBe(true);
    expect(uploadedPath.endsWith(".webp")).toBe(true);
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: "image/webp", cacheControl: "31536000", upsert: false });
    expect(update).toHaveBeenCalledWith({ image_storage_path: uploadedPath });
    if (result.ok) {
      expect(result.staleRemovalFailed).toBe(false);
    }
  });

  it("差し替え時は upload と DB 更新の成功後に古い object を削除する", async () => {
    const { client, remove } = makeClient();
    const previousPath = `${USER_ID}/recipe-images/${RECIPE_ID}/old.webp`;
    const result = await uploadRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, compressed, previousPath });

    expect(result.ok).toBe(true);
    expect(remove).toHaveBeenCalledWith([previousPath]);
  });

  it("古い object 削除に失敗しても成功扱いだが staleRemovalFailed を立てる", async () => {
    const { client } = makeClient({ removeError: { message: "boom" } });
    const previousPath = `${USER_ID}/recipe-images/${RECIPE_ID}/old.webp`;
    const result = await uploadRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, compressed, previousPath });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.staleRemovalFailed).toBe(true);
  });

  it("upload 失敗時は DB 更新せず原因つきエラーを返す", async () => {
    const { client, update } = makeClient({ uploadError: { message: "boom" } });
    const result = await uploadRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, compressed });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("修正方法");
    expect(update).not.toHaveBeenCalled();
  });

  it("DB 更新失敗時はアップロード済みの孤児 object を片付けてエラーを返す", async () => {
    const { client, remove } = makeClient({ updateError: { message: "boom" } });
    const result = await uploadRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, compressed });

    expect(result.ok).toBe(false);
    // いま upload した path の削除が呼ばれる（孤児を残さない）。
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe("setRecipeImageFromCandidate", () => {
  it("候補写真を新しい recipe-images path へコピーして DB を更新する", async () => {
    const { client, copy, update } = makeClient();
    const candidatePath = `${USER_ID}/cooking-history/old.jpg`;
    const result = await setRecipeImageFromCandidate(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      candidatePath,
      candidateContentType: "image/jpeg"
    });

    expect(result.ok).toBe(true);
    const copiedPath = copy.mock.calls[0][1] as string;
    expect(copy).toHaveBeenCalledWith(candidatePath, copiedPath);
    expect(copiedPath.startsWith(`${USER_ID}/recipe-images/${RECIPE_ID}/`)).toBe(true);
    expect(copiedPath.endsWith(".jpg")).toBe(true);
    expect(update).toHaveBeenCalledWith({ image_storage_path: copiedPath });
  });

  it("候補設定でも差し替え後に古いレシピ画像 object を削除する", async () => {
    const { client, remove } = makeClient();
    const previousPath = `${USER_ID}/recipe-images/${RECIPE_ID}/old.webp`;
    const result = await setRecipeImageFromCandidate(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      candidatePath: `${USER_ID}/cooking-history/source.jpg`,
      candidateContentType: "image/jpeg",
      previousPath
    });

    expect(result.ok).toBe(true);
    expect(remove).toHaveBeenCalledWith([previousPath]);
  });

  it("Storage copy が使えない場合は download から再 upload する", async () => {
    const { client, copy, download, upload } = makeClient({ copyError: { message: "copy failed" } });
    const result = await setRecipeImageFromCandidate(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      candidatePath: `${USER_ID}/cooking-history/source.jpg`,
      candidateContentType: "image/jpeg"
    });

    expect(result.ok).toBe(true);
    expect(copy).toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(`${USER_ID}/cooking-history/source.jpg`);
    expect(upload).toHaveBeenCalledWith(expect.stringContaining(`${USER_ID}/recipe-images/${RECIPE_ID}/`), expect.any(Blob), {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: false
    });
  });

  it("DB 更新に失敗したらコピー済み object を片付けてエラーにする", async () => {
    const { client, copy, remove } = makeClient({ updateError: { message: "boom" } });
    const result = await setRecipeImageFromCandidate(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      candidatePath: `${USER_ID}/cooking-history/source.jpg`
    });

    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledWith([copy.mock.calls[0][1]]);
  });
});

describe("fetchYoutubeThumbnailImage", () => {
  it("固定候補URLから画像content-typeのBlobを取得する", async () => {
    const fetcher = vi.fn(async () => new Response(new Blob(["jpeg"], { type: "image/jpeg" }), {
      headers: { "content-type": "image/jpeg", "content-length": "4" },
      status: 200
    }));

    const result = await fetchYoutubeThumbnailImage("dQw4w9WgXcQ", { fetcher });

    expect(result.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledWith("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", { redirect: "error" });
    if (result.ok) {
      expect(result.contentType).toBe("image/jpeg");
      expect(result.blob.size).toBeGreaterThan(0);
    }
  });

  it("非画像content-typeは失敗にする", async () => {
    const fetcher = vi.fn(async () => new Response("<html></html>", {
      headers: { "content-type": "text/html" },
      status: 200
    }));

    const result = await fetchYoutubeThumbnailImage("dQw4w9WgXcQ", { fetcher });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("許可された画像形式");
  });

  it("content-length が上限を超える画像は保存対象にしない", async () => {
    const fetcher = vi.fn(async () => new Response(new Blob(["x"], { type: "image/jpeg" }), {
      headers: { "content-type": "image/jpeg", "content-length": "9" },
      status: 200
    }));

    const result = await fetchYoutubeThumbnailImage("dQw4w9WgXcQ", { fetcher, maxBytes: 8 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("大きすぎます");
  });

  it("無効なvideoIdではfetchしない", async () => {
    const fetcher = vi.fn(async () => new Response(new Blob(["x"], { type: "image/jpeg" })));

    const result = await fetchYoutubeThumbnailImage("https://example.com/image.jpg", { fetcher });

    expect(result.ok).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("setRecipeImageFromYoutubeThumbnail", () => {
  it("サムネイル取得、Storage upload、recipes更新に成功するとStorage pathを返す", async () => {
    const { client, upload, update, storageFrom } = makeClient();
    const fetcher = vi.fn(async () => new Response(new Blob(["png"], { type: "image/png" }), {
      headers: { "content-type": "image/png", "content-length": "3" },
      status: 200
    }));

    const result = await setRecipeImageFromYoutubeThumbnail(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      videoId: "dQw4w9WgXcQ",
      fetcher
    });

    expect(result.ok).toBe(true);
    expect(storageFrom).toHaveBeenCalledWith("photos");
    const uploadedPath = upload.mock.calls[0][0] as string;
    expect(uploadedPath.startsWith(`${USER_ID}/recipe-images/${RECIPE_ID}/`)).toBe(true);
    expect(uploadedPath.endsWith(".png")).toBe(true);
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: "image/png", cacheControl: "31536000", upsert: false });
    expect(update).toHaveBeenCalledWith({ image_storage_path: uploadedPath });
    if (result.ok) expect(result.storagePath).toBe(uploadedPath);
  });

  it("Storage upload失敗時はDB更新しない", async () => {
    const { client, update } = makeClient({ uploadError: { message: "boom" } });
    const fetcher = vi.fn(async () => new Response(new Blob(["webp"], { type: "image/webp" }), {
      headers: { "content-type": "image/webp" },
      status: 200
    }));

    const result = await setRecipeImageFromYoutubeThumbnail(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      videoId: "dQw4w9WgXcQ",
      fetcher
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("DB更新失敗時はアップロード済みobjectを削除する", async () => {
    const { client, upload, remove } = makeClient({ updateError: { message: "boom" } });
    const fetcher = vi.fn(async () => new Response(new Blob(["jpeg"], { type: "image/jpeg" }), {
      headers: { "content-type": "image/jpeg" },
      status: 200
    }));

    const result = await setRecipeImageFromYoutubeThumbnail(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      videoId: "dQw4w9WgXcQ",
      fetcher
    });

    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });
});

describe("deleteRecipeImage", () => {
  it("DB を null に戻してから Storage object を削除する", async () => {
    const { client, update, remove } = makeClient();
    const storagePath = `${USER_ID}/recipe-images/${RECIPE_ID}/img.webp`;
    const result = await deleteRecipeImage(client, { userId: USER_ID, recipeId: RECIPE_ID, storagePath });

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ image_storage_path: null });
    expect(remove).toHaveBeenCalledWith([storagePath]);
  });

  it("DB 更新失敗時は Storage を触らずエラーを返す", async () => {
    const { client, remove } = makeClient({ updateError: { message: "boom" } });
    const result = await deleteRecipeImage(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      storagePath: `${USER_ID}/recipe-images/${RECIPE_ID}/img.webp`
    });

    expect(result.ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it("Storage 削除失敗でも成功扱いだが staleRemovalFailed を立てる", async () => {
    const { client } = makeClient({ removeError: { message: "boom" } });
    const result = await deleteRecipeImage(client, {
      userId: USER_ID,
      recipeId: RECIPE_ID,
      storagePath: `${USER_ID}/recipe-images/${RECIPE_ID}/img.webp`
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.staleRemovalFailed).toBe(true);
  });
});
