import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecipeThumb } from "@/components/ui/recipe-thumb";

describe("RecipeThumb", () => {
  it("renders an image when the recipe has a known demo photo", () => {
    render(<RecipeThumb recipe={{ name: "肉じゃが" }} />);
    const image = screen.getByRole("img", { name: "肉じゃが" });
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("/images/recipes/recipe-nikujaga.webp");
  });

  it("falls back to a placeholder when no demo photo matches", () => {
    render(<RecipeThumb recipe={{ name: "謎の創作料理" }} />);
    const placeholder = screen.getByRole("img", { name: "謎の創作料理" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder.className).toContain("recipe-thumb--placeholder");
    // 頭文字をプレースホルダに出す
    expect(placeholder.textContent).toBe("謎");
  });
});
