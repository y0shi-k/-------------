import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "@/components/home-dashboard";
import type { Recipe } from "@/lib/recipes/types";

const selectShellLeaf = vi.fn();

vi.mock("@/components/web-mode-shell", () => ({
  useShellSubView: () => ({ selectShellLeaf })
}));

const baseProps = {
  inventoryCount: 5,
  recipeCount: 4,
  mealCount: 2,
  historyCount: 7,
  cookCandidates: [],
  inventoryItems: [],
  mealSchedules: [],
  shoppingItems: []
};

function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: "r1",
    user_id: "u1",
    name: "鶏もも炒め",
    source: "",
    genre: ["和食"],
    steps: [],
    prep_steps: [],
    cook_count: 0,
    cooked_on_history: [],
    is_favorite: false,
    image_storage_path: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ingredients: [],
    ...overrides
  };
}

describe("HomeDashboard", () => {
  it("renders the greeting and the four summary counts", () => {
    render(<HomeDashboard {...baseProps} />);

    expect(screen.getByRole("heading", { name: /ようこそ/ })).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("navigates to the matching mode/leaf when a summary card is clicked", () => {
    selectShellLeaf.mockClear();
    render(<HomeDashboard {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /在庫/ }));
    expect(selectShellLeaf).toHaveBeenCalledWith("ingredients", "inventory");

    fireEvent.click(screen.getByRole("button", { name: /献立/ }));
    expect(selectShellLeaf).toHaveBeenCalledWith("recipes", "schedule");
  });

  it("does not render the featured section when there is no recipe to highlight", () => {
    render(<HomeDashboard {...baseProps} recipes={[]} />);

    expect(screen.queryByText("最近作ったレシピ")).toBeNull();
    expect(screen.queryByText("お気に入りレシピ")).toBeNull();
  });

  it("highlights recently cooked recipes as photo cards and navigates to recipes", () => {
    selectShellLeaf.mockClear();
    const recipes = [
      makeRecipe({ id: "old", name: "肉じゃが", cooked_on_history: ["2026-05-01"] }),
      makeRecipe({ id: "new", name: "鶏もも炒め", cooked_on_history: ["2026-06-01"] })
    ];
    render(<HomeDashboard {...baseProps} recipes={recipes} />);

    expect(screen.getByRole("heading", { name: "最近作ったレシピ" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /鶏もも炒め/ }));
    expect(selectShellLeaf).toHaveBeenCalledWith("recipes", "recipes");
  });

  it("falls back to favorites when nothing has been cooked yet", () => {
    const recipes = [
      makeRecipe({ id: "fav", name: "ハンバーグ", is_favorite: true }),
      makeRecipe({ id: "plain", name: "味噌汁" })
    ];
    render(<HomeDashboard {...baseProps} recipes={recipes} />);

    expect(screen.getByRole("heading", { name: "お気に入りレシピ" })).toBeTruthy();
    expect(screen.getByText("ハンバーグ")).toBeTruthy();
    expect(screen.queryByText("味噌汁")).toBeNull();
  });
});
