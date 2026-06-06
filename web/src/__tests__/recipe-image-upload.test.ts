import { describe, expect, it, vi } from "vitest";
import { deleteRecipeImage, setRecipeImageFromCandidate, uploadRecipeImage, type RecipeImageClient } from "@/lib/photos/recipe-image-upload";
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
  const upload = vi.fn<(path: string, body: Blob, opts?: { contentType?: string; upsert?: boolean }) => Promise<{ error: StorageError }>>(
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
    expect(upload.mock.calls[0][2]).toMatchObject({ contentType: "image/webp", upsert: false });
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
