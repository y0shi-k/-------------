import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipeFilterControls } from "@/components/recipe-filter-controls";

function renderControls(overrides: Partial<React.ComponentProps<typeof RecipeFilterControls>> = {}) {
  const props = {
    favoriteOnly: false,
    search: "",
    searchLogic: "and" as const,
    searchMode: "name" as const,
    sort: "created_desc" as const,
    onFavoriteFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    onSearchLogicChange: vi.fn(),
    onSearchModeChange: vi.fn(),
    onSortChange: vi.fn(),
    ...overrides
  };
  render(<RecipeFilterControls {...props} />);
  return props;
}

describe("RecipeFilterControls", () => {
  it("renders search-mode, sort, and favorite controls", () => {
    renderControls();
    // "レシピ名" appears both as a search-mode tab and a sort tab, so scope each region.
    const modeTabs = screen.getByLabelText("レシピ検索対象");
    expect(within(modeTabs).getByRole("button", { name: "レシピ名" })).toBeTruthy();
    expect(within(modeTabs).getByRole("button", { name: "食材" })).toBeTruthy();
    expect(within(modeTabs).getByRole("button", { name: "すべて" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "AND" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "OR" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "お気に入り" })).toBeTruthy();
    expect(screen.getByLabelText("レシピ検索")).toBeTruthy();
  });

  it("marks the active search mode and sort", () => {
    renderControls({ searchMode: "ingredient", sort: "name_asc" });
    expect(screen.getByRole("button", { name: "食材" }).getAttribute("data-active")).toBe("true");
    expect(screen.getByRole("button", { name: "レシピ名▼" }).getAttribute("data-active")).toBe("true");
  });

  it("invokes callbacks on interaction", () => {
    const props = renderControls({ search: "カレー" });
    fireEvent.click(screen.getByRole("button", { name: "食材" }));
    expect(props.onSearchModeChange).toHaveBeenCalledWith("ingredient");

    fireEvent.click(screen.getByRole("button", { name: "OR" }));
    expect(props.onSearchLogicChange).toHaveBeenCalledWith("or");

    fireEvent.change(screen.getByLabelText("レシピ検索"), { target: { value: "肉じゃが" } });
    expect(props.onSearchChange).toHaveBeenCalledWith("肉じゃが");

    fireEvent.click(screen.getByLabelText("検索をクリア"));
    expect(props.onSearchChange).toHaveBeenCalledWith("");

    fireEvent.click(screen.getByRole("button", { name: "調理回数" }));
    expect(props.onSortChange).toHaveBeenCalledWith("count_desc");

    fireEvent.click(screen.getByRole("button", { name: "お気に入り" }));
    expect(props.onFavoriteFilterChange).toHaveBeenCalledWith(true);
  });

  it("hides the clear button when search is empty", () => {
    renderControls({ search: "" });
    expect(screen.queryByLabelText("検索をクリア")).toBeNull();
  });
});
