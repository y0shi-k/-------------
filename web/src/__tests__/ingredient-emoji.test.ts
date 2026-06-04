import { describe, expect, it } from "vitest";
import { INGREDIENT_EMOJI_FALLBACK, ingredientEmoji } from "@/lib/ui/ingredient-emoji";

describe("ingredientEmoji", () => {
  it("matches representative keywords", () => {
    expect(ingredientEmoji("鶏もも肉")).toBe("🍗");
    expect(ingredientEmoji("トマト")).toBe("🍅");
    expect(ingredientEmoji("じゃがいも")).toBe("🥔");
    expect(ingredientEmoji("卵")).toBe("🥚");
    expect(ingredientEmoji("醤油")).toBe("🧂");
  });

  it("prefers the specific meat/fish rule over the generic 肉 rule", () => {
    expect(ingredientEmoji("豚バラ肉")).toBe("🥓");
    expect(ingredientEmoji("牛こま肉")).toBe("🥩");
    expect(ingredientEmoji("鮭の切り身")).toBe("🐟");
  });

  it("matches with full-width/katakana variations", () => {
    expect(ingredientEmoji("ニンジン")).toBe("🥕");
  });

  it("falls back to the default emoji for unknown ingredients", () => {
    expect(ingredientEmoji("謎の食材")).toBe(INGREDIENT_EMOJI_FALLBACK);
    expect(ingredientEmoji("")).toBe(INGREDIENT_EMOJI_FALLBACK);
  });
});
