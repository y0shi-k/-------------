import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import type { StockItem } from "@/lib/inventory/types";
import type { MealSchedule, Recipe, RecipeIngredient, ShoppingItem } from "@/lib/recipes/types";

const from = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from
  })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

const baseIngredient: RecipeIngredient = {
  id: "ingredient-1",
  user_id: "user-1",
  recipe_id: "recipe-1",
  item_type: "食材",
  name: "玉ねぎ",
  amount: 2,
  unit: "個",
  sort_order: 0,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

const baseRecipe: Recipe = {
  id: "recipe-1",
  user_id: "user-1",
  name: "カレー",
  source: "家庭メモ",
  genre: ["夕食"],
  steps: ["煮る"],
  prep_steps: ["切る"],
  cook_count: 0,
  cooked_on_history: [],
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z",
  ingredients: [baseIngredient]
};

const baseInventory: StockItem = {
  id: "stock-1",
  user_id: "user-1",
  category: "食材",
  name: "玉ねぎ",
  quantity: 1,
  unit: "個",
  display_expires_on: null,
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "",
  source: "manual",
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

const baseSchedule: MealSchedule = {
  id: "schedule-1",
  user_id: "user-1",
  scheduled_on: "2026-05-25",
  meal_type: "晩",
  recipe_id: "recipe-1",
  recipe_name: "カレー",
  status: "未完了",
  completed_at: null,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

function renderWorkspace(props?: Partial<React.ComponentProps<typeof RecipeMealWorkspace>>) {
  return render(
    <RecipeMealWorkspace
      initialInventoryItems={props?.initialInventoryItems ?? [baseInventory]}
      initialMealSchedules={props?.initialMealSchedules ?? []}
      initialRecipes={props?.initialRecipes ?? [baseRecipe]}
      initialShoppingItems={props?.initialShoppingItems ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

function insertSingleQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

function updateSingleQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const eqUser = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqUser }));
  const update = vi.fn(() => ({ eq: eqId }));
  return { update, eqId, eqUser, select, single };
}

function deleteQuery(error: unknown = null) {
  const eqUser = vi.fn().mockResolvedValue({ error });
  const eqRecipe = vi.fn(() => ({ eq: eqUser }));
  const deleteRows = vi.fn(() => ({ eq: eqRecipe }));
  return { deleteRows, eqRecipe, eqUser };
}

function insertListQuery(data: unknown[], error: unknown = null) {
  const select = vi.fn().mockResolvedValue({ data, error });
  const insert = vi.fn(() => ({ select }));
  return { insert, select };
}

describe("RecipeMealWorkspace", () => {
  beforeEach(() => {
    from.mockReset();
    refresh.mockReset();
  });

  it("shows recipes and recipe details", () => {
    renderWorkspace();

    expect(screen.getByRole("heading", { name: "レシピ・献立・買い物" })).toBeTruthy();
    expect(screen.getAllByText("カレー").length).toBeGreaterThan(0);
    expect(screen.getByText("玉ねぎ 2個")).toBeTruthy();
    expect(screen.getByText("切る")).toBeTruthy();
    expect(screen.getByText("煮る")).toBeTruthy();
  });

  it("creates a recipe with ingredients for the authenticated user", async () => {
    const savedRecipe = { ...baseRecipe, id: "recipe-new", name: "親子丼", ingredients: undefined };
    const savedIngredient = { ...baseIngredient, id: "ingredient-new", recipe_id: "recipe-new", name: "卵" };
    const recipeInsert = insertSingleQuery(savedRecipe);
    const ingredientInsert = insertListQuery([savedIngredient]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { insert: recipeInsert.insert };
      if (table === "recipe_ingredients") return { insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace({ initialRecipes: [] });

    fireEvent.change(screen.getByLabelText("レシピ名"), { target: { value: "親子丼" } });
    fireEvent.change(screen.getByLabelText("ジャンル"), { target: { value: "和食, 丼" } });
    fireEvent.change(screen.getByLabelText("参考元"), { target: { value: "母のメモ" } });
    const ingredientEditor = screen.getByLabelText("材料入力");
    fireEvent.change(within(ingredientEditor).getByLabelText("品名"), { target: { value: "卵" } });
    fireEvent.change(within(ingredientEditor).getByLabelText("数量"), { target: { value: "3" } });
    fireEvent.change(within(ingredientEditor).getByLabelText("単位"), { target: { value: "個" } });
    fireEvent.change(screen.getByLabelText("下準備"), { target: { value: "卵を溶く" } });
    fireEvent.change(screen.getByLabelText("調理手順"), { target: { value: "煮る\n卵でとじる" } });
    fireEvent.click(screen.getByRole("button", { name: "レシピを保存" }));

    await waitFor(() => {
      expect(recipeInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          name: "親子丼",
          genre: ["和食", "丼"],
          prep_steps: ["卵を溶く"],
          steps: ["煮る", "卵でとじる"]
        })
      );
      expect(ingredientInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "user-1",
          recipe_id: "recipe-new",
          item_type: "食材",
          name: "卵",
          amount: 3,
          unit: "個"
        })
      ]);
    });
    expect(await screen.findByText("レシピを追加しました。")).toBeTruthy();
  });

  it("edits a recipe and replaces its ingredients", async () => {
    const recipeUpdate = updateSingleQuery({ ...baseRecipe, name: "カレー改", ingredients: undefined });
    const ingredientDelete = deleteQuery();
    const ingredientInsert = insertListQuery([{ ...baseIngredient, name: "じゃがいも" }]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      if (table === "recipe_ingredients") return { delete: ingredientDelete.deleteRows, insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    fireEvent.change(screen.getByLabelText("レシピ名"), { target: { value: "カレー改" } });
    fireEvent.click(screen.getByRole("button", { name: "レシピを更新" }));

    await waitFor(() => {
      expect(recipeUpdate.update).toHaveBeenCalledWith(expect.objectContaining({ name: "カレー改", user_id: "user-1" }));
      expect(ingredientDelete.deleteRows).toHaveBeenCalled();
      expect(ingredientInsert.insert).toHaveBeenCalled();
    });
    expect(await screen.findByText("レシピを更新しました。")).toBeTruthy();
  });

  it("adds a recipe to the meal schedule", async () => {
    const scheduleInsert = insertSingleQuery(baseSchedule);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace();

    fireEvent.change(screen.getByLabelText("日付"), { target: { value: "2026-05-25" } });
    fireEvent.change(screen.getByLabelText("食事"), { target: { value: "晩" } });
    fireEvent.click(screen.getByRole("button", { name: "献立に追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          scheduled_on: "2026-05-25",
          meal_type: "晩",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          status: "未完了"
        })
      );
    });
    expect(await screen.findByText("献立に追加しました。")).toBeTruthy();
  });

  it("adds selected shortages to shopping items", async () => {
    const shoppingRow: ShoppingItem = {
      id: "shopping-1",
      user_id: "user-1",
      name: "玉ねぎ",
      required_quantity: 1,
      unit: "個",
      status: "未購入",
      linked_recipe_name: "カレー",
      source_type: "meal_schedule",
      purchased_at: null,
      created_at: "2026-05-24T00:00:00.000Z",
      updated_at: "2026-05-24T00:00:00.000Z"
    };
    const shoppingInsert = insertListQuery([shoppingRow]);
    from.mockReturnValue({ insert: shoppingInsert.insert });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    fireEvent.click(screen.getByLabelText(/玉ねぎ 1個/));
    fireEvent.click(screen.getByRole("button", { name: "選択食材を買い物へ" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("shopping_items");
      expect(shoppingInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "user-1",
          name: "玉ねぎ",
          required_quantity: 1,
          unit: "個",
          linked_recipe_name: "カレー",
          source_type: "meal_schedule"
        })
      ]);
    });
    expect(await screen.findByText("1件を買い物リストへ追加しました。")).toBeTruthy();
  });

  it("completes a meal schedule and creates cooking history", async () => {
    const completed = { ...baseSchedule, status: "完了", completed_at: "2026-05-24T10:00:00.000Z" };
    const scheduleUpdate = updateSingleQuery(completed);
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { update: scheduleUpdate.update };
      if (table === "cooking_history") return { insert: historyInsert };
      return {};
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    fireEvent.click(screen.getByRole("button", { name: "調理完了" }));

    await waitFor(() => {
      expect(scheduleUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "完了",
          completed_at: expect.any(String)
        })
      );
      expect(historyInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          meal_schedule_id: "schedule-1",
          note: "献立から調理完了"
        })
      );
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を調理完了にしました。料理履歴にも記録済みです。")).toBeTruthy();
  });

  it("does not save invalid recipe values", async () => {
    renderWorkspace({ initialRecipes: [] });

    fireEvent.click(screen.getByRole("button", { name: "レシピを保存" }));

    expect(await screen.findByText(/原因: レシピ名が未入力です。/)).toBeTruthy();
    expect(from).not.toHaveBeenCalled();
  });
});
