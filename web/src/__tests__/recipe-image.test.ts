import { describe, expect, it } from "vitest";
import { resolveRecipeImage } from "@/lib/ui/recipe-image";

describe("resolveRecipeImage", () => {
  it("returns the static demo path for a known recipe name", () => {
    expect(resolveRecipeImage({ name: "肉じゃが" })).toBe("/images/recipes/recipe-nikujaga.webp");
    expect(resolveRecipeImage({ name: "ハンバーグ" })).toBe("/images/recipes/recipe-hamburg.webp");
  });

  it("resolves aliases to the same slug", () => {
    expect(resolveRecipeImage({ name: "マーボー豆腐" })).toBe(resolveRecipeImage({ name: "麻婆豆腐" }));
  });

  it("absorbs surrounding/full-width whitespace", () => {
    expect(resolveRecipeImage({ name: "  オムライス　" })).toBe("/images/recipes/recipe-omurice.webp");
  });

  it("returns null for an unknown recipe name", () => {
    expect(resolveRecipeImage({ name: "謎の創作料理" })).toBeNull();
  });

  it("returns null for an empty name", () => {
    expect(resolveRecipeImage({ name: "" })).toBeNull();
  });
});
