import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WebModeShell } from "@/components/web-mode-shell";

function renderShell() {
  return render(
    <WebModeShell
      childrenByMode={{
        ingredients: <div>食材管理の中身</div>,
        recipes: <div>献立レシピの中身</div>,
        cooking: <div>料理記録の中身</div>
      }}
      historyCount={3}
      inventoryCount={5}
      mealCount={2}
      recipeCount={4}
      stagingCount={1}
      userEmail="user@example.com"
    />
  );
}

describe("WebModeShell", () => {
  it("starts from the ingredient mode and shows a persistent status", () => {
    renderShell();

    expect(screen.getByRole("heading", { name: "料理レシピ・食材管理" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("食材管理");
    expect(screen.getAllByText("在庫 5件 / 登録待ち 1件").length).toBeGreaterThan(0);
    expect(screen.getByText("食材管理の中身")).toBeTruthy();
    expect(screen.queryByText("献立レシピの中身")).toBeNull();
  });

  it("switches between the three Canvas-style modes", () => {
    renderShell();

    fireEvent.click(screen.getAllByRole("button", { name: /献立/ })[0]);
    expect(screen.getByRole("status").textContent).toContain("献立・レシピ");
    expect(screen.getByText("献立レシピの中身")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /記録/ })[0]);
    expect(screen.getByRole("status").textContent).toContain("料理・記録");
    expect(screen.getByText("料理記録の中身")).toBeTruthy();
  });
});
