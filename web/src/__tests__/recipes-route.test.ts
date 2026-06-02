import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/recipes/route";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser },
    rpc
  })
}));

function request(body: unknown) {
  return new Request("http://localhost/api/ai/recipes", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function okRecipeResponse() {
  return {
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  name: "豚キャベツ炒め",
                  genre: ["夕食"],
                  source: "AI提案",
                  ingredients: [{ item_type: "食材", name: "豚肉", amount: 200, unit: "g" }],
                  prep_steps: ["材料を切る"],
                  steps: ["炒める"]
                })
              }
            ]
          }
        }
      ]
    })
  } as Response;
}

describe("POST /api/ai/recipes", () => {
  beforeEach(() => {
    getUser.mockReset();
    rpc.mockReset();
    global.fetch = vi.fn();
  });

  it("returns 400 when the user-owned Gemini API key is missing", async () => {
    const response = await POST(request({ required: "豚肉", optional: "", sourceText: "" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: ユーザー自身のGemini APIキーが未入力です。")
    });
    expect(getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reserves one usage slot and uses the user-owned key without returning it", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockResolvedValue({ data: { ok: true, event_id: "event-1", remaining_feature: 19, remaining_total: 29 }, error: null });
    vi.mocked(fetch).mockResolvedValue(okRecipeResponse());

    const response = await POST(
      request({
        geminiApiKey: "user-owned-test-key",
        mode: "generate",
        required: "豚肉",
        optional: "キャベツ",
        sourceText: ""
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      recipe: expect.objectContaining({
        name: "豚キャベツ炒め",
        source: "AI提案"
      })
    });
    expect(JSON.stringify(body)).not.toContain("user-owned-test-key");
    expect(rpc).toHaveBeenCalledWith("consume_ai_usage", { p_feature: "recipe_generation" });
    expect(fetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-goog-api-key": "user-owned-test-key"
        })
      })
    );
  });

  it("returns a 429 feature-limit error and does not call Gemini when the feature cap is reached", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockResolvedValue({ data: { ok: false, reason: "feature_limit", remaining_feature: 0, remaining_total: 5 }, error: null });

    const response = await POST(request({ geminiApiKey: "user-owned-test-key", required: "豚肉" }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 本日のAIレシピ生成の上限に達しました。")
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a 429 total-limit error distinct from the feature-limit message", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockResolvedValue({ data: { ok: false, reason: "total_limit", remaining_feature: 4, remaining_total: 0 }, error: null });

    const response = await POST(request({ geminiApiKey: "user-owned-test-key", required: "豚肉" }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("原因: 本日のAI利用の合計上限に達しました。")
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refunds the reservation when Gemini fails to respond", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockImplementation(async (fn: string) => {
      if (fn === "consume_ai_usage") return { data: { ok: true, event_id: "event-1" }, error: null };
      return { data: true, error: null };
    });
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const response = await POST(request({ geminiApiKey: "user-owned-test-key", required: "豚肉" }));

    expect(response.status).toBe(502);
    expect(rpc).toHaveBeenCalledWith("refund_ai_usage", { p_event_id: "event-1" });
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("user-owned-test-key");
  });

  it("keeps the reservation (no refund) when Gemini responds ok but parsing fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpc.mockImplementation(async (fn: string) => {
      if (fn === "consume_ai_usage") return { data: { ok: true, event_id: "event-1" }, error: null };
      return { data: true, error: null };
    });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] })
    } as Response);

    const response = await POST(request({ geminiApiKey: "user-owned-test-key", required: "豚肉" }));

    expect(response.status).toBe(422);
    expect(rpc).not.toHaveBeenCalledWith("refund_ai_usage", expect.anything());
  });
});
