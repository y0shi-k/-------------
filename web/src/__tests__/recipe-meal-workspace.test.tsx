import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import type { StockItem } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, Recipe, RecipeIngredient } from "@/lib/recipes/types";

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
  unit_conversion: null,
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

const baseCandidate: CookCandidate = {
  id: "candidate-1",
  user_id: "user-1",
  recipe_id: "recipe-1",
  recipe_name: "カレー",
  reasons: ["期限が近い", "家族リクエスト"],
  status: "候補",
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

function renderWorkspace(props?: Partial<React.ComponentProps<typeof RecipeMealWorkspace>>) {
  return render(
    <RecipeMealWorkspace
      initialCookCandidates={props?.initialCookCandidates ?? []}
      initialInventoryItems={props?.initialInventoryItems ?? [baseInventory]}
      initialMealSchedules={props?.initialMealSchedules ?? []}
      initialRecipes={props?.initialRecipes ?? [baseRecipe]}
      userId={props?.userId ?? "user-1"}
    />
  );
}

function openRecipeEditor() {
  fireEvent.click(screen.getByRole("button", { name: "+ 新規レシピ" }));
}

function openScheduleView() {
  fireEvent.click(screen.getByRole("button", { name: "スケジュール" }));
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

function updateEqQuery(error: unknown = null) {
  const eqUser = vi.fn().mockResolvedValue({ error });
  const eqId = vi.fn(() => ({ eq: eqUser }));
  const update = vi.fn(() => ({ eq: eqId }));
  return { update, eqId, eqUser };
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
    global.fetch = vi.fn();
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
    openRecipeEditor();

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

  it("searches, sorts, and deletes recipes safely", async () => {
    const secondRecipe: Recipe = {
      ...baseRecipe,
      id: "recipe-2",
      name: "味噌汁",
      genre: ["朝食"],
      created_at: "2026-05-23T00:00:00.000Z",
      ingredients: [{ ...baseIngredient, id: "ingredient-2", recipe_id: "recipe-2", name: "豆腐" }]
    };
    const recipeDelete = deleteQuery();
    from.mockReturnValue({ delete: recipeDelete.deleteRows });

    renderWorkspace({ initialRecipes: [baseRecipe, secondRecipe] });

    fireEvent.change(screen.getByLabelText("レシピ検索"), { target: { value: "味噌" } });

    expect(within(screen.getByLabelText("レシピ一覧")).getByText("味噌汁")).toBeTruthy();
    expect(within(screen.getByLabelText("レシピ一覧")).queryByText("カレー")).toBeNull();

    fireEvent.change(screen.getByLabelText("レシピ検索"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("レシピの並び順"), { target: { value: "name_asc" } });

    expect(within(screen.getByLabelText("レシピ一覧")).getByText("味噌汁")).toBeTruthy();
    expect(within(screen.getByLabelText("レシピ一覧")).getByText("カレー")).toBeTruthy();

    fireEvent.click(within(screen.getByLabelText("レシピ一覧")).getAllByRole("button", { name: "削除" })[0]);
    expect(await screen.findByLabelText("削除確認")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("recipes");
      expect(recipeDelete.deleteRows).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を削除しました。")).toBeTruthy();
    expect(within(screen.getByLabelText("レシピ一覧")).queryByText("カレー")).toBeNull();
  });

  it("previews an AI recipe and applies it to the form", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        recipe: {
          name: "豚キャベツ炒め",
          genre: "和食",
          source: "AI提案",
          prep_steps: "キャベツを切る",
          steps: "豚肉を炒める\nキャベツを加える",
          ingredients: [{ item_type: "食材", name: "豚肉", amount: "200", unit: "g" }]
        }
      })
    } as Response);

    renderWorkspace();

    fireEvent.change(screen.getByLabelText("必須食材"), { target: { value: "豚肉" } });
    fireEvent.change(screen.getByLabelText("任意食材"), { target: { value: "キャベツ" } });
    fireEvent.click(screen.getByRole("button", { name: "AIレシピをプレビュー" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/ai/recipes", expect.objectContaining({ method: "POST" }));
    });
    expect(await screen.findByText("豚キャベツ炒め")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "フォームへ反映" }));

    expect(screen.getByLabelText("レシピ名")).toHaveProperty("value", "豚キャベツ炒め");
    expect(await screen.findByText("AIレシピ案を入力フォームへ反映しました。内容を確認して保存してください。")).toBeTruthy();
  });

  it("adds a recipe to the meal schedule", async () => {
    const scheduleInsert = insertSingleQuery(baseSchedule);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    // ＋ボタンからレシピピッカーを開いて追加する（クイック追加フォームは廃止）。
    fireEvent.click(screen.getAllByRole("button", { name: /朝に追加/ })[0]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /カレー/ }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          scheduled_on: "2026-05-25",
          meal_type: "朝",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          status: "未完了"
        })
      );
    });
    expect(await screen.findByText("献立に追加しました。")).toBeTruthy();
  });

  it("changes the recipe of a scheduled meal from the slot menu", async () => {
    const otherRecipe: Recipe = { ...baseRecipe, id: "recipe-2", name: "肉じゃが" };
    const replaced: MealSchedule = { ...baseSchedule, recipe_id: "recipe-2", recipe_name: "肉じゃが" };
    const scheduleUpdate = updateSingleQuery(replaced);
    from.mockReturnValue({ update: scheduleUpdate.update });

    renderWorkspace({ initialMealSchedules: [baseSchedule], initialRecipes: [baseRecipe, otherRecipe] });
    openScheduleView();

    expect(screen.getByLabelText("7日献立")).toBeTruthy();
    expect(within(screen.getByLabelText("7日献立")).getByText("カレー")).toBeTruthy();

    // カードをタップ → Canvas版同様「別のレシピに変更」でピッカーを開き差し替える。
    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "別のレシピに変更" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /肉じゃが/ }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleUpdate.update).toHaveBeenCalledWith({ recipe_id: "recipe-2", recipe_name: "肉じゃが" });
    });
    expect(await screen.findByText("献立を 肉じゃが に変更しました。")).toBeTruthy();
  });

  it("moves a scheduled meal to another slot via drag and drop", async () => {
    const movedSchedule: MealSchedule = { ...baseSchedule, scheduled_on: "2026-05-26", meal_type: "朝" };
    const scheduleUpdate = updateSingleQuery(movedSchedule);
    from.mockReturnValue({ update: scheduleUpdate.update });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    let transferred = "";
    const dataTransfer = {
      setData: (_type: string, value: string) => {
        transferred = value;
      },
      getData: () => transferred,
      effectAllowed: "",
      dropEffect: ""
    };
    const card = within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }).closest("article");
    const targetSlot = screen.getByRole("button", { name: "5/26(火) 朝に追加" }).closest(".schedule-slot");

    fireEvent.dragStart(card as Element, { dataTransfer });
    fireEvent.dragOver(targetSlot as Element, { dataTransfer });
    fireEvent.drop(targetSlot as Element, { dataTransfer });

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleUpdate.update).toHaveBeenCalledWith({ scheduled_on: "2026-05-26", meal_type: "朝" });
    });
    expect(await screen.findByText("カレー を 2026/05/26 朝 へ移動しました。")).toBeTruthy();
  });

  it("deletes a meal schedule", async () => {
    const scheduleDelete = deleteQuery();
    from.mockReturnValue({ delete: scheduleDelete.deleteRows });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(await screen.findByLabelText("削除確認")).toBeTruthy();
    fireEvent.click(within(screen.getByLabelText("削除確認")).getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleDelete.deleteRows).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を献立から削除しました。")).toBeTruthy();
  });

  it("adds, assigns, and removes cook candidates", async () => {
    const savedCandidate = { ...baseCandidate, id: "candidate-new" };
    const candidateInsert = insertSingleQuery(savedCandidate);
    const scheduleInsert = insertSingleQuery(baseSchedule);
    const candidateDelete = deleteQuery();

    from.mockImplementation((table: string) => {
      if (table === "cook_candidates") return { insert: candidateInsert.insert, delete: candidateDelete.deleteRows };
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      return {};
    });

    renderWorkspace();

    fireEvent.change(screen.getByLabelText("候補理由"), { target: { value: "期限が近い, 家族リクエスト" } });
    fireEvent.click(screen.getByRole("button", { name: "選択レシピを候補へ" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("cook_candidates");
      expect(candidateInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          reasons: ["期限が近い", "家族リクエスト"],
          status: "候補"
        })
      );
    });
    expect(await screen.findByText("カレー を作りたい候補に追加しました。")).toBeTruthy();
    expect(screen.getByText("期限が近い")).toBeTruthy();

    fireEvent.click(within(screen.getByLabelText("作りたい候補")).getByRole("button", { name: "献立へ追加" }));

    await waitFor(() => {
      expect(scheduleInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          status: "未完了"
        })
      );
    });
    expect(await screen.findByText("カレー を献立に追加しました。")).toBeTruthy();

    fireEvent.click(within(screen.getByLabelText("作りたい候補")).getByRole("button", { name: "解除" }));
    expect(await screen.findByLabelText("削除確認")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(candidateDelete.deleteRows).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を作りたい候補から解除しました。")).toBeTruthy();
  });

  it("opens a cooking viewer with ingredient tabs, stock status, and step chips", async () => {
    const seasoning: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-seasoning",
      item_type: "調味料",
      name: "醤油",
      amount: 1,
      unit: "大さじ",
      sort_order: 1
    };
    const viewerRecipe: Recipe = {
      ...baseRecipe,
      prep_steps: ["玉ねぎを切る"],
      steps: ["玉ねぎを炒めて醤油を加える"],
      ingredients: [baseIngredient, seasoning]
    };

    renderWorkspace({ initialRecipes: [viewerRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const viewer = screen.getByLabelText("調理ビューア");
    // ALLタブで食材が見える。
    expect(within(screen.getByLabelText("材料と在庫")).getByText("玉ねぎ")).toBeTruthy();

    // 在庫トグルで在庫状況（必要量との比較）を表示する。
    fireEvent.click(within(viewer).getByRole("button", { name: "在庫" }));
    expect(within(viewer).getByText("在庫: 1個 / 必要: 2個")).toBeTruthy();

    // 調味料タブで調味料に絞る。
    fireEvent.click(within(viewer).getByRole("button", { name: /^調味料/ }));
    expect(within(screen.getByLabelText("材料と在庫")).getByText("醤油")).toBeTruthy();

    // 手順は調理工程タブ、文中の材料はチップ化されてタップで照合できる。
    fireEvent.click(within(viewer).getByRole("button", { name: /^調理工程/ }));
    const stepChips = within(viewer).getAllByRole("button", { name: "玉ねぎ" });
    expect(stepChips.length).toBeGreaterThan(0);
    fireEvent.click(stepChips[0]);

    // 全画面オーバーレイで開き、戻るで閉じられる（Canvas版同様）。
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    expect(overlay).toBeTruthy();
    fireEvent.click(within(overlay).getByRole("button", { name: "戻る" }));
    expect(screen.queryByLabelText("調理ビューア")).toBeNull();
  });

  it("completes a meal schedule and creates cooking history", async () => {
    const completed = { ...baseSchedule, status: "完了", completed_at: "2026-05-24T10:00:00.000Z" };
    const scheduleUpdate = updateSingleQuery(completed);
    const inventoryUpdate = updateEqQuery();
    const historyInsert = insertSingleQuery({ id: "history-1" });
    const consumptionInsert = vi.fn().mockResolvedValue({ error: null });

    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { update: scheduleUpdate.update };
      if (table === "inventory_items") return { update: inventoryUpdate.update };
      if (table === "cooking_history") return { insert: historyInsert.insert };
      if (table === "cooking_consumption_events") return { insert: consumptionInsert };
      return {};
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    // Canvas版同様、操作モーダルの「調理を開始」で全画面の調理ビューアを開き、完了（消費）はビューア下部の「料理を完了する」で行う。
    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "調理を開始" }));
    const cookingViewer = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    fireEvent.click(within(cookingViewer).getByRole("button", { name: "料理を完了する" }));
    expect(await screen.findByText("消費量を確認してから「確定」を押してください。")).toBeTruthy();
    const consumptionModal = screen.getByRole("dialog", { name: "実際の消費量を調整" });
    expect(within(consumptionModal).getByLabelText("消費量確認")).toBeTruthy();
    fireEvent.click(within(consumptionModal).getByRole("button", { name: "確定" }));

    await waitFor(() => {
      expect(inventoryUpdate.update).toHaveBeenCalledWith({ quantity: 0 });
      expect(scheduleUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "完了",
          completed_at: expect.any(String)
        })
      );
      expect(historyInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          meal_schedule_id: "schedule-1",
          note: "献立から調理完了"
        })
      );
      expect(consumptionInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "user-1",
          cooking_history_id: "history-1",
          ingredient_name: "玉ねぎ",
          requested_amount: 2,
          consumed_amount: 1,
          stock_item_id: "stock-1"
        })
      ]);
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を調理完了にしました。料理履歴にも記録済みです。")).toBeTruthy();
  });

  it("does not save invalid recipe values", async () => {
    renderWorkspace({ initialRecipes: [] });
    openRecipeEditor();

    fireEvent.click(screen.getByRole("button", { name: "レシピを保存" }));

    expect(await screen.findByText(/原因: レシピ名が未入力です。/)).toBeTruthy();
    expect(from).not.toHaveBeenCalled();
  });
});
