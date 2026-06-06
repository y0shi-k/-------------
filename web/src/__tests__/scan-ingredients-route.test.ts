import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/scan-ingredients/route";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const from = vi.fn();
const storageFrom = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    from,
    storage: { from: storageFrom },
    rpc
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

const samplePhoto = {
  id: "photo-1",
  user_id: "user-1",
  bucket_id: "photos",
  storage_path: "user-1/ingredient-scan/photo-1.jpg",
  usage_type: "ingredient_scan",
  content_type: "image/jpeg"
};

const samplePhoto2 = {
  ...samplePhoto,
  id: "photo-2",
  storage_path: "user-1/ingredient-scan/photo-2.jpg"
};

function imageBlob() {
  return {
    type: "image/jpeg",
    arrayBuffer: async () => new TextEncoder().encode("photo").buffer
  };
}

function reservationOk() {
  rpc.mockImplementation(async (fn: string) => {
    if (fn === "consume_ai_usage") return { data: { ok: true, event_id: "event-1" }, error: null };
    return { data: true, error: null };
  });
}

function geminiResponse(name: string, category = "食材") {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  items: [{ category, name, quantity: 1, unit: "個", storage_location: "冷蔵庫" }]
                })
              }
            ]
          }
        }
      ]
    })
  } as Response;
}

describe("POST /api/ai/scan-ingredients", () => {
  beforeEach(() => {
    getUser.mockReset();
    from.mockReset();
    storageFrom.mockReset();
    rpc.mockReset();
    global.fetch = vi.fn();
  });

  it("returns 401 when the user is not logged in", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: ログイン状態を確認できませんでした。")
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 400 when the user-owned Gemini API key is missing", async () => {
    const response = await POST(request({ photoId: "photo-1" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: expect.stringContaining("原因: ユーザー自身のGemini APIキーが未入力です。")
    });
    expect(JSON.stringify(body)).not.toContain("user-owned-test-key");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("does not reserve a slot for another user's missing photo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(null, new Error("not found")));

    const response = await POST(request({ photoId: "other-photo", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a 429 feature-limit error and does not download the photo when the cap is reached", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(samplePhoto));
    rpc.mockResolvedValue({ data: { ok: false, reason: "feature_limit" }, error: null });

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 本日の食材写真解析の上限に達しました。")
    });
    expect(storageFrom).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a 429 total-limit error distinct from the feature-limit message", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(samplePhoto));
    rpc.mockResolvedValue({ data: { ok: false, reason: "total_limit" }, error: null });

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 本日のAI利用の合計上限に達しました。")
    });
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it("refunds the reservation when the photo download fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(samplePhoto));
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: new Error("download failed") })
    });

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(500);
    expect(rpc).toHaveBeenCalledWith("refund_ai_usage", { p_event_id: "event-1" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds the reservation when Gemini fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockReturnValue(photoQuery(samplePhoto));
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: imageBlob(), error: null })
    });
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(502);
    expect(rpc).toHaveBeenCalledWith("refund_ai_usage", { p_event_id: "event-1" });
  });

  it("scans a photo and returns inventory candidates without refunding on success", async () => {
    const candidate = {
      user_id: "user-1",
      category: "食材",
      name: "牛乳",
      quantity: 1,
      unit: "本",
      unit_conversion: null,
      display_expires_on: null,
      effective_expires_on: null,
      storage_location: "冷蔵庫",
      status_note: "AI解析候補",
      source: "ai_photo"
    };

    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from.mockImplementation((table: string) => {
      if (table === "photos") return photoQuery(samplePhoto);
      return {};
    });
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: imageBlob(), error: null })
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

    const response = await POST(request({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ items: [candidate] });
    expect(JSON.stringify(body)).not.toContain("user-owned-test-key");
    expect(rpc).not.toHaveBeenCalledWith("refund_ai_usage", expect.anything());
  });

  it("scans multiple photos and merges candidates", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from
      .mockReturnValueOnce(photoQuery(samplePhoto))
      .mockReturnValueOnce(photoQuery(samplePhoto2));
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: imageBlob(), error: null })
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(geminiResponse("牛乳"))
      .mockResolvedValueOnce(geminiResponse("醤油", "調味料"));

    const response = await POST(request({ photoIds: ["photo-1", "photo-2"], geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        expect.objectContaining({ name: "牛乳", source: "ai_photo", user_id: "user-1" }),
        expect.objectContaining({ name: "醤油", category: "調味料", source: "ai_photo", user_id: "user-1" })
      ]
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("consume_ai_usage", { p_feature: "ingredient_scan" });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("returns successful candidates with a failed count when one of multiple photos fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from
      .mockReturnValueOnce(photoQuery(samplePhoto))
      .mockReturnValueOnce(photoQuery(samplePhoto2));
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi
        .fn()
        .mockResolvedValueOnce({ data: imageBlob(), error: null })
        .mockResolvedValueOnce({ data: null, error: new Error("download failed") })
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse("牛乳"));

    const response = await POST(request({ photoIds: ["photo-1", "photo-2"], geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [expect.objectContaining({ name: "牛乳" })],
      failedCount: 1,
      errors: [expect.stringContaining("原因: 非公開Storageから写真を読み出せませんでした。")]
    });
    expect(rpc).toHaveBeenCalledWith("refund_ai_usage", { p_event_id: "event-1" });
  });

  it("returns an error when all selected photos fail", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    from
      .mockReturnValueOnce(photoQuery(samplePhoto))
      .mockReturnValueOnce(photoQuery(samplePhoto2));
    reservationOk();
    storageFrom.mockReturnValue({
      download: vi.fn().mockResolvedValue({ data: null, error: new Error("download failed") })
    });

    const response = await POST(request({ photoIds: ["photo-1", "photo-2"], geminiApiKey: "user-owned-test-key" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 非公開Storageから写真を読み出せませんでした。")
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
