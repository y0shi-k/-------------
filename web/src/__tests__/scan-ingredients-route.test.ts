import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/scan-ingredients/route";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const from = vi.fn();
const storageFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    from,
    storage: { from: storageFrom }
  })
}));

function request(body: unknown) {
  return new Request("http://localhost/api/ai/scan-ingredients", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function photoQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const eqUsageType = vi.fn(() => ({ single }));
  const eqUserId = vi.fn(() => ({ eq: eqUsageType }));
  const eqId = vi.fn(() => ({ eq: eqUserId }));
  const select = vi.fn(() => ({ eq: eqId }));
  return { select };
}

function stagingQuery(data: unknown, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ order }));
  const insert = vi.fn(() => ({ select }));
  return { insert };
}

function imageBlob() {
  return {
    type: "image/jpeg",
    arrayBuffer: async () => new TextEncoder().encode("photo").buffer
  };
}

describe("POST /api/ai/scan-ingredients", () => {
  beforeEach(() => {
    getUser.mockReset();
    from.mockReset();
    storageFrom.mockReset();
    global.fetch = vi.fn();
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  it("returns 401 when the user is not logged in", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request({ photoId: "photo-1" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: ログイン状態を確認できませんでした。")
    });
  });

  it("returns 500 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(request({ photoId: "photo-1" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: Gemini APIキーがサーバーに設定されていません。")
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("does not scan another user's missing photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(null, new Error("not found")));

    const response = await POST(request({ photoId: "other-photo" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 解析対象の写真が見つかりませんでした。")
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not insert staging items when Gemini fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(
      photoQuery({
        id: "photo-1",
        user_id: "user-1",
        bucket_id: "photos",
        storage_path: "user-1/ingredient-scan/photo-1.jpg",
        usage_type: "ingredient_scan",
        content_type: "image/jpeg"
      })
    );
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: imageBlob(),
        error: null
      })
    });
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const response = await POST(request({ photoId: "photo-1" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: Gemini APIの解析に失敗しました。")
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("scans a photo and inserts staging items for the logged-in user", async () => {
    const inserted = {
      id: "staging-1",
      user_id: "user-1",
      category: "食材",
      name: "牛乳",
      quantity: 1,
      unit: "本",
      storage_location: "冷蔵庫",
      status_note: "AI解析候補",
      source: "ai_photo"
    };

    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockImplementation((table: string) => {
      if (table === "photos") {
        return photoQuery({
          id: "photo-1",
          user_id: "user-1",
          bucket_id: "photos",
          storage_path: "user-1/ingredient-scan/photo-1.jpg",
          usage_type: "ingredient_scan",
          content_type: "image/jpeg"
        });
      }
      if (table === "staging_items") {
        return stagingQuery([inserted]);
      }
      return {};
    });
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: imageBlob(),
        error: null
      })
    });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    items: [{ category: "食材", name: "牛乳", quantity: 1, unit: "本", storage_location: "冷蔵庫" }]
                  })
                }
              ]
            }
          }
        ]
      })
    } as Response);

    const response = await POST(request({ photoId: "photo-1" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [inserted] });
    expect(fetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-goog-api-key": "test-gemini-key"
        })
      })
    );
  });
});
