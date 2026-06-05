import { describe, expect, it, vi } from "vitest";
import { parseGeminiRecipeResponse } from "@/lib/ai/recipe-generation";

vi.mock("server-only", () => ({}));

function geminiResponse(recipe: Record<string, unknown>) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(recipe) }]
        }
      }
    ]
  };
}

const baseRecipe = {
  name: "豚キャベツ炒め",
  genre: ["夕食"],
  ingredients: [{ item_type: "食材", name: "豚肉", amount: 200, unit: "g" }],
  prep_steps: ["材料を切る"],
  steps: ["炒める"]
};

describe("parseGeminiRecipeResponse - source 抽出", () => {
  it("structureモードでAIがsource空のとき、本文の単一URLを抽出する", () => {
    const sourceText = "美味しい炒め物。出典: https://example.com/recipe/123 を参考に。";
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "" }), {
      mode: "structure",
      sourceText
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("https://example.com/recipe/123");
    }
  });

  it("structureモードで本文に複数URLがあれば改行区切りで保持する", () => {
    const sourceText = "参考: https://a.example.com/r/1 と http://b.example.com/r/2 です。";
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "" }), {
      mode: "structure",
      sourceText
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("https://a.example.com/r/1\nhttp://b.example.com/r/2");
    }
  });

  it("AIがsource(URL)を返した場合はそれを優先する", () => {
    const result = parseGeminiRecipeResponse(
      geminiResponse({ ...baseRecipe, source: "https://ai.example.com/picked" }),
      { mode: "structure", sourceText: "本文中のURL https://body.example.com/other" }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("https://ai.example.com/picked");
    }
  });

  it("structureモードで本文にURLが無ければsourceは空（AI提案にしない）", () => {
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "AI提案" }), {
      mode: "structure",
      sourceText: "URLを含まないレシピ本文。"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("");
    }
  });

  it("generateモードはsource既定の『AI提案』を維持する", () => {
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "" }), {
      mode: "generate",
      sourceText: ""
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("AI提案");
    }
  });

  it("長いURLを160字で切らずに保持する", () => {
    const longUrl = `https://example.com/${"a".repeat(200)}`;
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "" }), {
      mode: "structure",
      sourceText: `参考: ${longUrl}`
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe(longUrl);
      expect(result.recipe.source.length).toBeGreaterThan(160);
    }
  });

  it("URL末尾の句読点や閉じ括弧をトリムする", () => {
    const result = parseGeminiRecipeResponse(geminiResponse({ ...baseRecipe, source: "" }), {
      mode: "structure",
      sourceText: "出典（https://example.com/recipe）。"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recipe.source).toBe("https://example.com/recipe");
    }
  });
});
