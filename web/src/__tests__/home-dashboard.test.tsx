import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "@/components/home-dashboard";

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
});
