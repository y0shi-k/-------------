import { describe, expect, it, vi } from "vitest";
import {
  buildGeminiIngredientScanRequest,
  parseGeminiIngredientResponse,
  toStagingInsert
} from "@/lib/ai/ingredient-scan";

vi.mock("server-only", () => ({}));

describe("ingredient scan parsing", () => {
  it("normalizes a valid Gemini JSON response", () => {
    const result = parseGeminiIngredientResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  items: [
                    {
                      category: "調味料",
                      name: "しょうゆ",
                      quantity: "2",
                      unit: "本",
                      display_expires_on: "2026-06-01",
                      effective_expires_on: "2026-06-03",
                      storage_location: "常温",
                      status_note: "未開封"
                    }
                  ]
                })
              }
            ]
          }
        }
      ]
    });

    expect(result).toEqual({
      ok: true,
      items: [
        expect.objectContaining({
          category: "調味料",
          name: "しょうゆ",
          quantity: 2,
          unit: "本",
          display_expires_on: "2026-06-01",
          effective_expires_on: "2026-06-03",
          storage_location: "常温",
          status_note: "未開封"
        })
      ]
    });
  });

  it("fails safely when Gemini returns broken JSON", () => {
    const result = parseGeminiIngredientResponse({
      candidates: [{ content: { parts: [{ text: "これはJSONではありません" }] } }]
    });

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("原因: AI解析結果をJSONとして読めませんでした。")
    });
  });

  it("filters non-food receipt details and fills defaults", () => {
    const result = parseGeminiIngredientResponse({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  items: [
                    { name: "店舗名", quantity: 1, unit: "件" },
                    { name: "電話番号", quantity: 1, unit: "件" },
                    { name: "豆腐" }
                  ]
                })
              }
            ]
          }
        }
      ]
    });

    expect(result).toEqual({
      ok: true,
      items: [
        expect.objectContaining({
          category: "食材",
          name: "豆腐",
          quantity: 1,
          unit: "個",
          storage_location: "その他",
          status_note: "AI解析候補"
        })
      ]
    });
  });

  it("converts a candidate to a staging insert", () => {
    const insert = toStagingInsert(
      {
        category: "食材",
        name: "牛乳",
        quantity: 1,
        unit: "本",
        display_expires_on: null,
        effective_expires_on: null,
        storage_location: "冷蔵庫",
        status_note: "AI解析候補",
        raw_text: "{\"name\":\"牛乳\"}"
      },
      "user-1"
    );

    expect(insert).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        name: "牛乳",
        source: "ai_photo",
        raw_text: "{\"name\":\"牛乳\"}"
      })
    );
  });

  it("builds a Gemini inline image request without exposing the API key", () => {
    const request = buildGeminiIngredientScanRequest("image/jpeg", "base64-photo");

    expect(request.contents[0].parts[0]).toEqual({
      inline_data: {
        mime_type: "image/jpeg",
        data: "base64-photo"
      }
    });
    expect(JSON.stringify(request)).not.toContain("GEMINI_API_KEY");
  });
});
