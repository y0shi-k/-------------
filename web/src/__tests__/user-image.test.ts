import { describe, expect, it, vi } from "vitest";
import { buildInventoryImageStoragePath, buildRecipeImageStoragePath } from "@/lib/photos/compress";
import { PHOTOS_BUCKET, createUserImageSignedUrl } from "@/lib/photos/user-image";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("buildRecipeImageStoragePath", () => {
  it("先頭フォルダが user_id で recipe-images/<recipe_id> 配下になる", () => {
    const path = buildRecipeImageStoragePath(USER_ID, "recipe-1");
    expect(path.startsWith(`${USER_ID}/recipe-images/recipe-1/`)).toBe(true);
    expect(path.endsWith(".webp")).toBe(true);
    // 既存 storage policy（foldername[1] = auth.uid）と DB の所有制約に一致する先頭セグメント。
    expect(path.split("/")[0]).toBe(USER_ID);
  });

  it("拡張子を上書きできる", () => {
    expect(buildRecipeImageStoragePath(USER_ID, "r1", "jpg").endsWith(".jpg")).toBe(true);
  });

  it("毎回ユニークな path を返す", () => {
    expect(buildRecipeImageStoragePath(USER_ID, "r1")).not.toBe(buildRecipeImageStoragePath(USER_ID, "r1"));
  });
});

describe("buildInventoryImageStoragePath", () => {
  it("先頭フォルダが user_id で inventory-images/<item_id> 配下になる", () => {
    const path = buildInventoryImageStoragePath(USER_ID, "item-9");
    expect(path.startsWith(`${USER_ID}/inventory-images/item-9/`)).toBe(true);
    expect(path.split("/")[0]).toBe(USER_ID);
  });
});

describe("createUserImageSignedUrl", () => {
  function clientReturning(signedUrl: string | null) {
    const createSignedUrl = vi.fn(async () => ({ data: signedUrl ? { signedUrl } : null }));
    return { client: { storage: { from: vi.fn(() => ({ createSignedUrl })) } }, createSignedUrl };
  }

  it("path が null/空なら呼び出さずに null を返す", async () => {
    const { client, createSignedUrl } = clientReturning("https://example/signed");
    expect(await createUserImageSignedUrl(client, null)).toBeNull();
    expect(await createUserImageSignedUrl(client, "")).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("photos バケットに対して署名付きURLを発行する", async () => {
    const { client, createSignedUrl } = clientReturning("https://example/signed");
    const url = await createUserImageSignedUrl(client, `${USER_ID}/recipe-images/r1/a.webp`, 120);
    expect(url).toBe("https://example/signed");
    expect(client.storage.from).toHaveBeenCalledWith(PHOTOS_BUCKET);
    expect(createSignedUrl).toHaveBeenCalledWith(`${USER_ID}/recipe-images/r1/a.webp`, 120);
  });

  it("失敗時は例外を投げず null を返す", async () => {
    const client = {
      storage: {
        from: () => ({
          createSignedUrl: async () => {
            throw new Error("network");
          }
        })
      }
    };
    expect(await createUserImageSignedUrl(client, `${USER_ID}/x.webp`)).toBeNull();
  });
});
