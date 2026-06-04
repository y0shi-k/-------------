import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRecipeImage } from "@/lib/ui/recipe-image";

const demoRecipeImages = [
  ["鶏もも炒め", "/images/recipes/recipe-chicken-stir-fry.webp"],
  ["肉じゃが", "/images/recipes/recipe-nikujaga.webp"],
  ["ハンバーグ", "/images/recipes/recipe-hamburg.webp"],
  ["麻婆豆腐", "/images/recipes/recipe-mapo-tofu.webp"],
  ["鮭の塩焼き", "/images/recipes/recipe-grilled-salmon.webp"],
  ["カレーライス", "/images/recipes/recipe-curry-rice.webp"]
] as const;

describe("resolveRecipeImage", () => {
  it("returns the static demo path for a known recipe name", () => {
    expect(resolveRecipeImage({ name: "肉じゃが" })).toBe("/images/recipes/recipe-nikujaga.webp");
    expect(resolveRecipeImage({ name: "ハンバーグ" })).toBe("/images/recipes/recipe-hamburg.webp");
  });

  it("resolves every seeded demo recipe to an existing public image", () => {
    for (const [name, expectedPath] of demoRecipeImages) {
      expect(resolveRecipeImage({ name })).toBe(expectedPath);
      expect(existsSync(path.join(process.cwd(), "public", expectedPath))).toBe(true);
    }
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
