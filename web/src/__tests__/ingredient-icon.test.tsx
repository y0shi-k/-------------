import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IngredientIcon } from "@/components/ui/ingredient-icon";

describe("IngredientIcon", () => {
  it("renders the matched emoji inside an accessible icon", () => {
    render(<IngredientIcon name="トマト" />);
    const icon = screen.getByRole("img", { name: "トマト" });
    expect(icon.className).toContain("ingredient-icon");
    expect(icon.textContent).toBe("🍅");
  });

  it("applies the requested size modifier", () => {
    render(<IngredientIcon name="卵" size="lg" />);
    expect(screen.getByRole("img", { name: "卵" }).className).toContain("ingredient-icon--lg");
  });

  it("uses the fallback emoji for unknown ingredients", () => {
    render(<IngredientIcon name="謎の食材" />);
    expect(screen.getByRole("img", { name: "謎の食材" }).textContent).toBe("🥘");
  });
});
