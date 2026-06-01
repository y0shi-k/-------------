import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/recipes/route";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser }
  })
}));

function request(body: unknown) {
  return new Request("http://localhost/api/ai/recipes", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("POST /api/ai/recipes", () => {
  beforeEach(() => {
    getUser.mockReset();
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

  it("uses the user-owned Gemini API key without returning it in the response", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    vi.mocked(fetch).mockResolvedValue({
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
    } as Response);

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
});
