import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IngredientIcon } from "@/components/ui/ingredient-icon";

describe("IngredientIcon", () => {
  it("renders a standard image for matched ingredients", () => {
    render(<IngredientIcon name="トマト" />);
    const icon = screen.getByRole("img", { name: "トマト" });
    expect(icon.className).toContain("ingredient-icon");
    expect(icon.querySelector("img")?.getAttribute("src")).toBe("/images/ingredients/ingredient-tomato.svg");
  });

  it("applies the requested size modifier", () => {
    render(<IngredientIcon name="卵" size="lg" />);
    expect(screen.getByRole("img", { name: "卵" }).className).toContain("ingredient-icon--lg");
  });

  it("absorbs common spelling variants through the image resolver", () => {
    render(<IngredientIcon name="玉葱スライス" />);
    const icon = screen.getByRole("img", { name: "玉葱スライス" });
    expect(icon.querySelector("img")?.getAttribute("src")).toBe("/images/ingredients/ingredient-onion.svg");
  });

  it("uses a seasoning image when the category is seasoning and the name is generic", () => {
    render(<IngredientIcon category="調味料" name="自家製たれ" />);
    const icon = screen.getByRole("img", { name: "自家製たれ" });
    expect(icon.querySelector("img")?.getAttribute("src")).toBe("/images/ingredients/ingredient-seasoning.svg");
  });

  it("uses the fallback emoji for unknown ingredients", () => {
    render(<IngredientIcon name="謎の食材" />);
    expect(screen.getByRole("img", { name: "謎の食材" }).textContent).toBe("🥘");
  });
});
