import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRecipeImageUrls } from "@/lib/photos/use-recipe-image-urls";
import { __resetSignedUrlCacheForTest } from "@/lib/photos/signed-url-cache";
import type { SignedUrlCapableClient } from "@/lib/photos/user-image";

const USER_ID = "11111111-1111-1111-1111-111111111111";

// 署名URLは module-level の共有キャッシュ（TKT-0203）に乗るため、テスト間で path を再利用すると
// 前テストのURLがヒットしてしまう。各テストを独立させるためキャッシュを破棄する。
beforeEach(() => {
  __resetSignedUrlCacheForTest();
});

function makeClient(resolver: (path: string) => string | null): SignedUrlCapableClient {
  return {
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => {
          const url = resolver(path);
          return { data: url ? { signedUrl: url } : null };
        }
      })
    }
  };
}

describe("useRecipeImageUrls", () => {
  it("image_storage_path を持つレシピだけ署名付きURLを発行する", async () => {
    const client = makeClient((path) => `https://signed/${path}`);
    const recipes = [
      { id: "r1", image_storage_path: `${USER_ID}/recipe-images/r1/a.webp` },
      { id: "r2", image_storage_path: null }
    ];

    const { result } = renderHook(() => useRecipeImageUrls(recipes, client));

    await waitFor(() => expect(result.current.size).toBe(1));
    expect(result.current.get("r1")).toBe(`https://signed/${USER_ID}/recipe-images/r1/a.webp`);
    // path が null のレシピは Map に載らない（プレースホルダ/デモへフォールバック）。
    expect(result.current.has("r2")).toBe(false);
  });

  it("署名URL発行に失敗した path は Map に載せない", async () => {
    const client = makeClient((path) => (path.includes("r1") ? "https://signed/ok" : null));
    const recipes = [
      { id: "r1", image_storage_path: `${USER_ID}/recipe-images/r1/a.webp` },
      { id: "r2", image_storage_path: `${USER_ID}/recipe-images/r2/b.webp` }
    ];

    const { result } = renderHook(() => useRecipeImageUrls(recipes, client));

    await waitFor(() => expect(result.current.get("r1")).toBe("https://signed/ok"));
    expect(result.current.has("r2")).toBe(false);
  });

  it("対象 path が無ければ createSignedUrl を呼ばず空 Map を返す", async () => {
    const createSignedUrl = vi.fn(async () => ({ data: null }));
    const client: SignedUrlCapableClient = { storage: { from: () => ({ createSignedUrl }) } };
    const recipes = [{ id: "r1", image_storage_path: null }];

    const { result } = renderHook(() => useRecipeImageUrls(recipes, client));

    await waitFor(() => expect(result.current.size).toBe(0));
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
