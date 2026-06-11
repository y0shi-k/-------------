import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import type { StockItem } from "@/lib/inventory/types";
import type { AiUsageSummary } from "@/lib/ai/usage";
import type { CookCandidate, MealSchedule, Recipe, RecipeIngredient } from "@/lib/recipes/types";

const from = vi.fn();
const refresh = vi.fn();
const shellMocks = vi.hoisted(() => ({
  clearPendingRecipe: vi.fn(),
  pendingRecipeId: null as string | null,
  pendingRecipeOrigin: "recipes" as "recipes" | "cooking",
  returnToMode: vi.fn(),
  showStatusMessage: vi.fn(),
  aiUsageSummary: null as AiUsageSummary | null,
  refreshAiUsage: vi.fn(async () => {}),
  selectedSubViews: {
    ingredients: "inventory" as "inventory" | "shopping",
    recipes: "recipes" as "recipes" | "schedule",
    cooking: "timeline" as "calendar" | "timeline" | "insights"
  },
  selectShellLeaf: vi.fn()
}));

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

vi.mock("@/components/web-mode-shell", () => ({
  useShellNavigation: () => ({
    clearPendingRecipe: shellMocks.clearPendingRecipe,
    pendingRecipeId: shellMocks.pendingRecipeId,
    pendingRecipeOrigin: shellMocks.pendingRecipeOrigin,
    requestViewRecipe: vi.fn(),
    returnToMode: shellMocks.returnToMode
  }),
  useShellStatusMessage: () => ({
    showStatusMessage: shellMocks.showStatusMessage
  }),
  useShellAiUsage: () => ({
    aiUsageSummary: shellMocks.aiUsageSummary,
    refreshAiUsage: shellMocks.refreshAiUsage
  }),
  useShellSubView: () => ({
    activeDesktopTarget: { group: "recipes", kind: "mode", leaf: shellMocks.selectedSubViews.recipes },
    selectedSubViews: shellMocks.selectedSubViews,
    selectShellLeaf: shellMocks.selectShellLeaf
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
  group_index: 0,
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
  is_favorite: false,
  image_storage_path: null,
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
  image_storage_path: null,
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

function updateTripleEqQuery(error: unknown = null) {
  const eqUser = vi.fn().mockResolvedValue({ error });
  const eqRecipe = vi.fn(() => ({ eq: eqUser }));
  const eqId = vi.fn(() => ({ eq: eqRecipe }));
  const update = vi.fn(() => ({ eq: eqId }));
  return { update, eqId, eqRecipe, eqUser };
}

function dragDataTransfer() {
  const values = new Map<string, string>();
  return {
    dropEffect: "",
    effectAllowed: "",
    getData: vi.fn((key: string) => values.get(key) ?? ""),
    setData: vi.fn((key: string, value: string) => values.set(key, value))
  };
}

function deleteQuery(error: unknown = null) {
  const eqUser = vi.fn().mockResolvedValue({ error });
  const eqRecipe = vi.fn(() => ({ eq: eqUser }));
  const deleteRows = vi.fn(() => ({ eq: eqRecipe }));
  return { deleteRows, eqRecipe, eqUser };
}

// shopping_items の「meal_schedule_id / user_id / status で絞って delete → select("id")」用モック。
function deleteShoppingByScheduleQuery(data: unknown[], error: unknown = null) {
  const select = vi.fn().mockResolvedValue({ data, error });
  const eqStatus = vi.fn(() => ({ select }));
  const eqUser = vi.fn(() => ({ eq: eqStatus }));
  const eqSchedule = vi.fn(() => ({ eq: eqUser }));
  const deleteRows = vi.fn(() => ({ eq: eqSchedule }));
  return { deleteRows, eqSchedule, eqUser, eqStatus, select };
}

function selectEqQuery(data: unknown[], error: unknown = null) {
  const eqUser = vi.fn().mockResolvedValue({ data, error });
  const eqSchedule = vi.fn(() => ({ eq: eqUser }));
  const select = vi.fn(() => ({ eq: eqSchedule }));
  return { eqSchedule, eqUser, select };
}

function insertListQuery(data: unknown[], error: unknown = null) {
  const select = vi.fn().mockResolvedValue({ data, error });
  const insert = vi.fn(() => ({ select }));
  return { insert, select };
}

describe("RecipeMealWorkspace", () => {
  beforeEach(() => {
    // スケジュールは今日中心（today-3〜today+3）で描画されるため、固定日付の
    // テストスケジュール（5/25・5/26）が窓内に入るよう today を 2026-05-28 に固定する。
    // Date のみ偽装し、setTimeout 等は実タイマーのまま（waitFor を壊さない）。
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-28T12:00:00"));
    from.mockReset();
    refresh.mockReset();
    shellMocks.clearPendingRecipe.mockReset();
    shellMocks.pendingRecipeId = null;
    shellMocks.pendingRecipeOrigin = "recipes";
    shellMocks.returnToMode.mockReset();
    shellMocks.showStatusMessage.mockReset();
    shellMocks.aiUsageSummary = null;
    shellMocks.refreshAiUsage.mockReset();
    shellMocks.refreshAiUsage.mockResolvedValue(undefined);
    shellMocks.selectedSubViews = {
      ingredients: "inventory",
      recipes: "recipes",
      cooking: "timeline"
    };
    shellMocks.selectShellLeaf.mockReset();
    global.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows recipes and recipe details", () => {
    renderWorkspace();

    expect(screen.getByRole("heading", { name: "レシピ・献立・買い物" })).toBeTruthy();
    expect(screen.getAllByText("カレー").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "カレー" }).some((image) => image.tagName === "IMG")).toBe(true);
    expect(screen.getByText("玉ねぎ 2個")).toBeTruthy();
    expect(screen.getByText("切る")).toBeTruthy();
    expect(screen.getByText("煮る")).toBeTruthy();
  });

  it("opens the recipe editor from the cooking detail viewer", () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    fireEvent.click(screen.getByRole("button", { name: "このレシピを編集" }));

    expect(screen.getByRole("heading", { name: "レシピを編集" })).toBeTruthy();
    expect((screen.getByLabelText("レシピ名") as HTMLInputElement).value).toBe("カレー");
  });

  it("keeps recipe photo placeholders when no static image matches", () => {
    renderWorkspace({ initialRecipes: [{ ...baseRecipe, name: "謎の創作料理" }] });

    const placeholders = screen.getAllByRole("img", { name: "謎の創作料理" });
    expect(placeholders.some((image) => image.tagName === "DIV" && image.className.includes("recipe-thumb--placeholder"))).toBe(true);
  });

  it("shows thumbnails on cook candidates", () => {
    renderWorkspace({ initialCookCandidates: [baseCandidate] });

    expect(screen.getByRole("heading", { name: "作りたい候補" })).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "カレー" }).some((image) => image.className.includes("candidate-thumb"))).toBe(true);
  });

  it("opens the schedule view from the shell subview selection", async () => {
    shellMocks.selectedSubViews = {
      ingredients: "inventory",
      recipes: "schedule",
      cooking: "timeline"
    };

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    await waitFor(() => {
      expect(screen.getByLabelText("7日献立")).toBeTruthy();
    });
    expect(screen.getByText("カレー")).toBeTruthy();
  });

  it("reports internal recipe view changes back to the shell", () => {
    renderWorkspace();

    openScheduleView();

    expect(shellMocks.selectShellLeaf).toHaveBeenCalledWith("recipes", "schedule");
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
    // Canvas版（AppSheet風）ジャンルピッカー: 既存候補はEnterで選択、新規は入力してEnterで作成。
    const genreInput = screen.getByLabelText("ジャンルを検索・追加");
    fireEvent.change(genreInput, { target: { value: "和食" } });
    fireEvent.keyDown(genreInput, { key: "Enter" });
    fireEvent.change(genreInput, { target: { value: "丼" } });
    fireEvent.keyDown(genreInput, { key: "Enter" });
    fireEvent.change(screen.getByLabelText("参考元"), { target: { value: "母のメモ" } });
    const ingredientEditor = screen.getByLabelText("材料入力");
    fireEvent.change(within(ingredientEditor).getByLabelText("品名"), { target: { value: "卵" } });
    fireEvent.change(within(ingredientEditor).getByLabelText("数量"), { target: { value: "3" } });
    fireEvent.change(within(ingredientEditor).getByLabelText("単位を検索・追加"), { target: { value: "個" } });
    fireEvent.keyDown(within(ingredientEditor).getByLabelText("単位を検索・追加"), { key: "Enter" });
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

  it("reorders edit-modal food ingredients via drag and drop and persists sort_order", async () => {
    const carrot: RecipeIngredient = { ...baseIngredient, id: "ingredient-2", name: "にんじん", sort_order: 1 };
    const salt: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 2
    };
    const recipeUpdate = updateSingleQuery({ ...baseRecipe, ingredients: undefined });
    const ingredientDelete = deleteQuery();
    const ingredientInsert = insertListQuery([{ ...baseIngredient }]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      if (table === "recipe_ingredients") return { delete: ingredientDelete.deleteRows, insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, carrot, salt] }] });
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    const dataTransfer = dragDataTransfer();
    const carrotRow = screen.getByLabelText("にんじんをドラッグして並び替え").closest(".ingredient-row") as HTMLElement;
    const onionRow = screen.getByLabelText("玉ねぎをドラッグして並び替え").closest(".ingredient-row") as HTMLElement;
    fireEvent.dragStart(carrotRow, { dataTransfer });
    fireEvent.drop(onionRow, { dataTransfer });

    fireEvent.click(screen.getByRole("button", { name: "レシピを更新" }));

    await waitFor(() => {
      expect(ingredientInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "にんじん", item_type: "食材", sort_order: 0 }),
        expect.objectContaining({ name: "玉ねぎ", item_type: "食材", sort_order: 1 }),
        expect.objectContaining({ name: "塩", item_type: "調味料", sort_order: 2 })
      ]);
    });
  });

  it("keeps edit-modal reordering within a section and never crosses food/seasoning", async () => {
    const salt: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 1
    };
    const recipeUpdate = updateSingleQuery({ ...baseRecipe, ingredients: undefined });
    const ingredientDelete = deleteQuery();
    const ingredientInsert = insertListQuery([{ ...baseIngredient }]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      if (table === "recipe_ingredients") return { delete: ingredientDelete.deleteRows, insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, salt] }] });
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    // 食材（玉ねぎ）を調味料（塩）の行へドロップしてもセクションをまたがない。
    const dataTransfer = dragDataTransfer();
    const onionRow = screen.getByLabelText("玉ねぎをドラッグして並び替え").closest(".ingredient-row") as HTMLElement;
    const saltRow = screen.getByLabelText("塩をドラッグして並び替え").closest(".ingredient-row") as HTMLElement;
    fireEvent.dragStart(onionRow, { dataTransfer });
    fireEvent.drop(saltRow, { dataTransfer });

    fireEvent.click(screen.getByRole("button", { name: "レシピを更新" }));

    await waitFor(() => {
      expect(ingredientInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "玉ねぎ", item_type: "食材", sort_order: 0 }),
        expect.objectContaining({ name: "塩", item_type: "調味料", sort_order: 1 })
      ]);
    });
  });

  it("groups edit-modal ingredients, keeps input clicks separate, and persists group_index", async () => {
    const carrot: RecipeIngredient = { ...baseIngredient, id: "ingredient-2", name: "にんじん", sort_order: 1 };
    const salt: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 2
    };
    const recipeUpdate = updateSingleQuery({ ...baseRecipe, ingredients: undefined });
    const ingredientDelete = deleteQuery();
    const ingredientInsert = insertListQuery([{ ...baseIngredient }]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      if (table === "recipe_ingredients") return { delete: ingredientDelete.deleteRows, insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, carrot, salt] }] });
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    const ingredientEditor = screen.getByLabelText("材料入力");
    const onionRow = within(ingredientEditor).getByDisplayValue("玉ねぎ").closest(".ingredient-row") as HTMLElement;
    const carrotRow = within(ingredientEditor).getByDisplayValue("にんじん").closest(".ingredient-row") as HTMLElement;

    fireEvent.click(within(onionRow).getByLabelText("品名"));
    expect(onionRow.getAttribute("data-selected")).toBe("false");
    expect(within(ingredientEditor).queryByRole("button", { name: "グルーピング" })).toBeNull();

    fireEvent.click(onionRow);
    fireEvent.click(carrotRow, { metaKey: true });
    fireEvent.click(within(ingredientEditor).getByRole("button", { name: "グルーピング" }));

    expect(within(ingredientEditor).getByText("A")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "レシピを更新" }));

    await waitFor(() => {
      expect(ingredientInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "玉ねぎ", item_type: "食材", sort_order: 0, group_index: 1 }),
        expect.objectContaining({ name: "にんじん", item_type: "食材", sort_order: 1, group_index: 1 }),
        expect.objectContaining({ name: "塩", item_type: "調味料", sort_order: 2, group_index: 0 })
      ]);
    });
  });

  it("ungroups edit-modal subgroups and labels seasonings with hiragana", async () => {
    const soy: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "醤油",
      amount: 1,
      unit: "大さじ",
      sort_order: 1,
      group_index: 1
    };
    const mirin: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-4",
      item_type: "調味料",
      name: "みりん",
      amount: 1,
      unit: "大さじ",
      sort_order: 2,
      group_index: 1
    };
    const recipeUpdate = updateSingleQuery({ ...baseRecipe, ingredients: undefined });
    const ingredientDelete = deleteQuery();
    const ingredientInsert = insertListQuery([{ ...baseIngredient }]);

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      if (table === "recipe_ingredients") return { delete: ingredientDelete.deleteRows, insert: ingredientInsert.insert };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, soy, mirin] }] });
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    const seasoningEditor = screen.getByLabelText("調味料入力");
    expect(within(seasoningEditor).getByText("あ")).toBeTruthy();
    fireEvent.click(within(seasoningEditor).getByRole("button", { name: "解除" }));
    fireEvent.click(screen.getByRole("button", { name: "レシピを更新" }));

    await waitFor(() => {
      expect(ingredientInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "玉ねぎ", item_type: "食材", sort_order: 0, group_index: 0 }),
        expect.objectContaining({ name: "醤油", item_type: "調味料", sort_order: 1, group_index: 0 }),
        expect.objectContaining({ name: "みりん", item_type: "調味料", sort_order: 2, group_index: 0 })
      ]);
    });
  });

  it("toggles selected genres from the whole option row", () => {
    renderWorkspace({ initialRecipes: [{ ...baseRecipe, genre: ["和食", "洋食", "中華"] }] });

    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    fireEvent.focus(screen.getByLabelText("ジャンルを検索・追加"));

    expect(screen.getByText("3 Selected")).toBeTruthy();

    const genrePopover = document.querySelector(".genre-popover");
    expect(genrePopover).toBeTruthy();
    const japaneseGenreRow = within(genrePopover as HTMLElement).getByRole("button", { name: /和食/ });

    fireEvent.click(japaneseGenreRow);
    expect(screen.getByText("2 Selected")).toBeTruthy();
  });

  it("renders selected genre tags as draggable chips", () => {
    renderWorkspace({ initialRecipes: [{ ...baseRecipe, genre: ["和食", "洋食", "中華"] }] });

    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    const tagContainer = document.querySelector(".genre-tags") as HTMLElement;
    const japaneseTag = tagContainer.querySelector('[data-genre="和食"]') as HTMLElement;
    const westernTag = tagContainer.querySelector('[data-genre="洋食"]') as HTMLElement;
    const chineseTag = tagContainer.querySelector('[data-genre="中華"]') as HTMLElement;

    expect(japaneseTag.draggable).toBe(true);
    expect(westernTag.draggable).toBe(true);
    expect(chineseTag.draggable).toBe(true);
  });

  it("summarizes overflowing recipe card genres with a tooltip chip", () => {
    renderWorkspace({ initialRecipes: [{ ...baseRecipe, genre: ["和食", "洋食", "中華", "韓国", "イタリアン"] }] });

    const recipeList = screen.getByLabelText("レシピ一覧");
    const moreChip = within(recipeList).getByText("+2");

    expect(moreChip.getAttribute("data-tooltip")).toBe("韓国\nイタリアン");
  });

  it("opens the cooking viewer when a recipe card thumbnail is clicked", () => {
    renderWorkspace({ initialRecipes: [baseRecipe] });

    const recipeList = screen.getByLabelText("レシピ一覧");
    const thumbButton = within(recipeList).getByRole("button", { name: "カレー の調理ビューを開く" });

    fireEvent.click(thumbButton);

    expect(screen.getByRole("dialog", { name: "調理ビューア全画面" })).toBeTruthy();
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

  it("opens the editor directly after inline AI recipe generation", async () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "user-owned-test-key");
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
    fireEvent.click(screen.getByRole("button", { name: "AIレシピを編集モーダルで開く" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/ai/recipes",
        expect.objectContaining({
          body: JSON.stringify({
            mode: "generate",
            geminiApiKey: "user-owned-test-key",
            required: "豚肉",
            optional: "キャベツ",
            sourceText: ""
          }),
          method: "POST"
        })
      );
    });

    expect(await screen.findByRole("heading", { name: "新規レシピ" })).toBeTruthy();
    expect(screen.getByLabelText("レシピ名")).toHaveProperty("value", "豚キャベツ炒め");
    expect(screen.queryByRole("button", { name: "フォームへ反映" })).toBeNull();
    expect(await screen.findByText("AIレシピ案を編集モーダルで開きました。内容を確認して保存してください。")).toBeTruthy();
  });

  it("shows a clear error when the Gemini API key is missing", async () => {
    renderWorkspace();

    fireEvent.change(screen.getByLabelText("必須食材"), { target: { value: "豚肉" } });
    fireEvent.click(screen.getByRole("button", { name: "AIレシピを編集モーダルで開く" }));

    expect(await screen.findByText(/原因: ユーザー自身のGemini APIキーが未入力です。/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("disables the AI recipe button and shows remaining counts when the recipe limit is reached", async () => {
    shellMocks.aiUsageSummary = {
      ok: true,
      recipe_generation: { used: 20, limit: 20, remaining: 0 },
      ingredient_scan: { used: 2, limit: 10, remaining: 8 },
      total: { used: 22, limit: 30, remaining: 8 }
    };
    renderWorkspace();

    // 残量メーターは設定画面へ集約済み（ボード内には表示しない）。
    // ボードでは上限到達時にAIレシピボタンが無効化されることのみを保証する。
    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "AIレシピを編集モーダルで開く" }) as HTMLButtonElement).disabled
      ).toBe(true);
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("structures pasted recipe text and opens the editor without an intermediate preview", async () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "user-owned-test-key");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        recipe: {
          name: "鶏そぼろ丼",
          genre: "和食",
          source: "メモ",
          prep_steps: "調味料を混ぜる",
          steps: "鶏ひき肉を炒める\nご飯にのせる",
          ingredients: [{ item_type: "食材", name: "鶏ひき肉", amount: "200", unit: "g" }]
        }
      })
    } as Response);

    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "テキストから追加" }));
    fireEvent.change(screen.getByLabelText("レシピテキスト"), { target: { value: "鶏そぼろ丼の作り方" } });
    fireEvent.click(screen.getByRole("button", { name: "AIで構造化" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/ai/recipes",
        expect.objectContaining({
          body: JSON.stringify({
            mode: "structure",
            geminiApiKey: "user-owned-test-key",
            required: "",
            optional: "",
            sourceText: "鶏そぼろ丼の作り方"
          }),
          method: "POST"
        })
      );
    });

    expect(await screen.findByRole("heading", { name: "新規レシピ" })).toBeTruthy();
    expect(screen.getByLabelText("レシピ名")).toHaveProperty("value", "鶏そぼろ丼");
    expect(screen.queryByRole("button", { name: "編集モーダルで確認" })).toBeNull();
    // AI実行後に context の refreshAiUsage が呼ばれること
    await waitFor(() => {
      expect(shellMocks.refreshAiUsage).toHaveBeenCalled();
    });
  });

  it("clears the text import body whenever the modal is reopened", () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "テキストから追加" }));
    fireEvent.change(screen.getByLabelText("レシピテキスト"), { target: { value: "前回の貼り付けテキスト" } });
    expect(screen.getByLabelText("レシピテキスト")).toHaveProperty("value", "前回の貼り付けテキスト");

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    fireEvent.click(screen.getByRole("button", { name: "テキストから追加" }));

    expect(screen.getByLabelText("レシピテキスト")).toHaveProperty("value", "");
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

  it("opens the shortage modal after adding via the schedule + picker", async () => {
    // スケジュール「＋」の新規追加でも、登録成立後に在庫不足チェック→不足モーダルを開く。
    const scheduleInsert = insertSingleQuery(baseSchedule);
    const shoppingInsert = insertListQuery([{ id: "shop-1" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    fireEvent.click(screen.getAllByRole("button", { name: /朝に追加/ })[0]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /カレー/ }));

    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    expect(within(shortageModal).getByText("玉ねぎ")).toBeTruthy();

    fireEvent.click(within(shortageModal).getByLabelText("表示中をすべて選択"));
    fireEvent.click(within(shortageModal).getByRole("button", { name: /選択したものを追加/ }));

    await waitFor(() => {
      expect(shoppingInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "玉ねぎ", required_quantity: 1, source_type: "recipe_detail" })
      ]);
    });
    expect(scheduleInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ meal_type: "朝", recipe_id: "recipe-1", status: "未完了" })
    );
  });

  it("does not run the shortage check when changing a slot recipe via the picker", async () => {
    // 「別のレシピに変更」(replace) は在庫チェック対象外。登録の置換のみ行う。
    const otherRecipe: Recipe = { ...baseRecipe, id: "recipe-2", name: "肉じゃが" };
    const replaced: MealSchedule = { ...baseSchedule, recipe_id: "recipe-2", recipe_name: "肉じゃが" };
    const scheduleUpdate = updateSingleQuery(replaced);
    from.mockReturnValue({ update: scheduleUpdate.update });

    renderWorkspace({ initialMealSchedules: [baseSchedule], initialRecipes: [baseRecipe, otherRecipe] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "別のレシピに変更" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /肉じゃが/ }));

    await waitFor(() => {
      expect(scheduleUpdate.update).toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog", { name: "買い物に追加するもの" })).toBeNull();
  });

  it("adds a schedule entry from the cooking viewer header via the mini calendar", async () => {
    const scheduleInsert = insertSingleQuery(baseSchedule);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    // ユーザーに見えるレシピ詳細ヘッダー＝調理ビューア全画面のヘッダー。そこからモーダルを開く。
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    fireEvent.click(within(overlay).getByRole("button", { name: "スケジュールに追加" }));

    const dialog = screen.getByRole("dialog", { name: "スケジュールに追加" });

    // 日付を選ぶ前は食事タイプ選択は出ない。
    expect(within(dialog).queryByRole("button", { name: "朝" })).toBeNull();

    // 先頭セル（今日）を選ぶと朝/昼/晩が現れる。
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          meal_type: "朝",
          recipe_id: "recipe-1",
          recipe_name: "カレー",
          scheduled_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          status: "未完了"
        })
      );
    });
    expect(await screen.findByText("献立に追加しました。")).toBeTruthy();
  });

  it("adds a schedule entry from a recipe card calendar button", async () => {
    const scheduleInsert = insertSingleQuery(baseSchedule);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    // 各レシピカードの小ボタンからも同じモーダルを開ける。
    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "晩" }));

    await waitFor(() => {
      expect(scheduleInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({ meal_type: "晩", recipe_id: "recipe-1", status: "未完了" })
      );
    });
  });

  it("opens the shortage modal after a recipe-originated schedule entry and adds shortages to shopping", async () => {
    // baseRecipe は玉ねぎ2個、baseInventory は玉ねぎ1個 → 不足1個が発生する。
    const scheduleInsert = insertSingleQuery(baseSchedule);
    const shoppingInsert = insertListQuery([{ id: "shop-1" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    // 登録成立後に不足選択モーダルが開く。
    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    expect(within(shortageModal).getByText("玉ねぎ")).toBeTruthy();

    fireEvent.click(within(shortageModal).getByLabelText("表示中をすべて選択"));
    fireEvent.click(within(shortageModal).getByRole("button", { name: /選択したものを追加/ }));

    await waitFor(() => {
      expect(shoppingInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "user-1",
          name: "玉ねぎ",
          required_quantity: 1,
          unit: "個",
          status: "未購入",
          linked_recipe_name: "カレー",
          source_type: "recipe_detail"
        })
      ]);
    });
    // スケジュール登録自体は成立している。
    expect(scheduleInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ meal_type: "朝", recipe_id: "recipe-1", status: "未完了" })
    );
  });

  it("keeps the recipe schedule registered when the shortage modal is dismissed", async () => {
    const scheduleInsert = insertSingleQuery(baseSchedule);
    const shoppingInsert = insertListQuery([{ id: "shop-1" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    fireEvent.click(within(shortageModal).getByRole("button", { name: "あとで" }));

    // モーダルを閉じても買い物追加は走らず、献立は登録済みのまま。
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "買い物に追加するもの" })).toBeNull();
    });
    expect(shoppingInsert.insert).not.toHaveBeenCalled();
    expect(scheduleInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ meal_type: "朝", recipe_id: "recipe-1", status: "未完了" })
    );
  });

  it("does not open the shortage modal when inventory covers the recipe", async () => {
    // 玉ねぎ在庫を2個に増やすと不足は出ない。
    const scheduleInsert = insertSingleQuery(baseSchedule);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace({
      initialMealSchedules: [baseSchedule],
      initialInventoryItems: [{ ...baseInventory, quantity: 2 }]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    await waitFor(() => {
      expect(scheduleInsert.insert).toHaveBeenCalled();
    });
    expect(screen.queryByRole("dialog", { name: "買い物に追加するもの" })).toBeNull();
  });

  // -----------------------------------------------------------------------
  // TKT-0224: 表記ゆれマッチング（inventoryAmountByNameAndUnit）
  // -----------------------------------------------------------------------

  it("does not open the shortage modal when inventory name is a synonym (卵 covers たまご)", async () => {
    // 在庫「卵 3個」× レシピ「たまご 2個」→ 在庫が十分なので不足モーダルが開かない。
    const tamagoRecipe: Recipe = {
      ...baseRecipe,
      id: "recipe-tamagodon",
      name: "卵丼",
      ingredients: [
        { ...baseIngredient, id: "ingredient-tamago", recipe_id: "recipe-tamagodon", name: "たまご", amount: 2, unit: "個" }
      ]
    };
    const tamagoStock: StockItem = { ...baseInventory, id: "stock-tamago", name: "卵", quantity: 3, unit: "個" };
    const scheduleForTamago: MealSchedule = { ...baseSchedule, id: "schedule-tamago", recipe_id: "recipe-tamagodon", recipe_name: "卵丼" };
    const scheduleInsert = insertSingleQuery(scheduleForTamago);
    from.mockReturnValue({ insert: scheduleInsert.insert });

    renderWorkspace({
      initialRecipes: [tamagoRecipe],
      initialMealSchedules: [scheduleForTamago],
      initialInventoryItems: [tamagoStock]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    await waitFor(() => {
      expect(scheduleInsert.insert).toHaveBeenCalled();
    });
    // 不足モーダルが開かない（買い物候補に「たまご」が出ない）。
    expect(screen.queryByRole("dialog", { name: "買い物に追加するもの" })).toBeNull();
  });

  it("opens the shortage modal with correct shortage when synonym stock is partial (卵 1個 vs たまご 3個)", async () => {
    // 在庫「卵 1個」× レシピ「たまご 3個」→ 不足 2個。
    const tamagoRecipe: Recipe = {
      ...baseRecipe,
      id: "recipe-tamagodon",
      name: "卵丼",
      ingredients: [
        { ...baseIngredient, id: "ingredient-tamago", recipe_id: "recipe-tamagodon", name: "たまご", amount: 3, unit: "個" }
      ]
    };
    const tamagoStock: StockItem = { ...baseInventory, id: "stock-tamago", name: "卵", quantity: 1, unit: "個" };
    const scheduleForTamago: MealSchedule = { ...baseSchedule, id: "schedule-tamago", recipe_id: "recipe-tamagodon", recipe_name: "卵丼" };
    const scheduleInsert = insertSingleQuery(scheduleForTamago);
    const shoppingInsert = insertListQuery([{ id: "shop-tamago" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({
      initialRecipes: [tamagoRecipe],
      initialMealSchedules: [scheduleForTamago],
      initialInventoryItems: [tamagoStock]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    // 不足モーダルが開き、「たまご」が不足候補に出る。
    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    expect(within(shortageModal).getByText("たまご")).toBeTruthy();

    fireEvent.click(within(shortageModal).getByLabelText("表示中をすべて選択"));
    fireEvent.click(within(shortageModal).getByRole("button", { name: /選択したものを追加/ }));

    await waitFor(() => {
      // 不足量 2個（3 - 1）として INSERT される。
      expect(shoppingInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "たまご", required_quantity: 2, unit: "個" })
      ]);
    });
  });

  it("opens the shortage modal for partial-match-only names (豚こま切れ肉 does not cover 豚肉)", async () => {
    // 在庫「豚こま切れ肉」× レシピ「豚肉」→ 部分一致のみ。同一とは見なさず不足として出る。
    const butaRecipe: Recipe = {
      ...baseRecipe,
      id: "recipe-buta",
      name: "生姜焼き",
      ingredients: [
        { ...baseIngredient, id: "ingredient-buta", recipe_id: "recipe-buta", name: "豚肉", amount: 200, unit: "g" }
      ]
    };
    const butaStock: StockItem = { ...baseInventory, id: "stock-buta", name: "豚こま切れ肉", quantity: 300, unit: "g" };
    const scheduleForButa: MealSchedule = { ...baseSchedule, id: "schedule-buta", recipe_id: "recipe-buta", recipe_name: "生姜焼き" };
    const scheduleInsert = insertSingleQuery(scheduleForButa);
    const shoppingInsert = insertListQuery([{ id: "shop-buta" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({
      initialRecipes: [butaRecipe],
      initialMealSchedules: [scheduleForButa],
      initialInventoryItems: [butaStock]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    // 部分一致は合算対象外なので不足として出る。
    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    expect(within(shortageModal).getByText("豚肉")).toBeTruthy();
  });

  it("does not aggregate inventory when unit differs (卵 1個 does not cover たまご 1g)", async () => {
    // 単位不一致（個 vs g）は従来どおり別物扱い。名前が類義語でも合算しない。
    const tamagoGRecipe: Recipe = {
      ...baseRecipe,
      id: "recipe-tamago-g",
      name: "ふわふわ卵",
      ingredients: [
        { ...baseIngredient, id: "ingredient-tamago-g", recipe_id: "recipe-tamago-g", name: "たまご", amount: 1, unit: "g" }
      ]
    };
    const tamagoKoStock: StockItem = { ...baseInventory, id: "stock-tamago-ko", name: "卵", quantity: 10, unit: "個" };
    const scheduleForTamagoG: MealSchedule = { ...baseSchedule, id: "schedule-tamago-g", recipe_id: "recipe-tamago-g", recipe_name: "ふわふわ卵" };
    const scheduleInsert = insertSingleQuery(scheduleForTamagoG);
    const shoppingInsert = insertListQuery([{ id: "shop-tamago-g" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({
      initialRecipes: [tamagoGRecipe],
      initialMealSchedules: [scheduleForTamagoG],
      initialInventoryItems: [tamagoKoStock]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    // 単位違いは合算対象外なので不足として出る。
    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    expect(within(shortageModal).getByText("たまご")).toBeTruthy();
  });

  it("filters the schedule recipe picker with the shared search and favorite controls", () => {
    const favoriteMiso: Recipe = {
      ...baseRecipe,
      id: "recipe-2",
      name: "味噌汁",
      is_favorite: true,
      ingredients: [{ ...baseIngredient, id: "ingredient-2", recipe_id: "recipe-2", name: "豆腐" }]
    };

    renderWorkspace({ initialMealSchedules: [baseSchedule], initialRecipes: [baseRecipe, favoriteMiso] });
    openScheduleView();

    fireEvent.click(screen.getAllByRole("button", { name: /朝に追加/ })[0]);
    const dialog = screen.getByRole("dialog");

    // 初期はレシピ一覧と同じく全レシピが見える。
    expect(within(dialog).getByRole("button", { name: /カレー/ })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: /味噌汁/ })).toBeTruthy();

    // 共通の検索（レシピ名）で filterAndSortRecipes により絞り込める。
    fireEvent.change(within(dialog).getByLabelText("レシピ検索"), { target: { value: "味噌" } });
    expect(within(dialog).queryByRole("button", { name: /カレー/ })).toBeNull();
    expect(within(dialog).getByRole("button", { name: /味噌汁/ })).toBeTruthy();

    // 検索を消し、お気に入り絞り込み（is_favorite 先行フィルタ）に切り替える。
    fireEvent.change(within(dialog).getByLabelText("レシピ検索"), { target: { value: "" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "お気に入り" }));
    expect(within(dialog).queryByRole("button", { name: /カレー/ })).toBeNull();
    expect(within(dialog).getByRole("button", { name: /味噌汁/ })).toBeTruthy();
  });

  it("resets the picker filter state each time it reopens", () => {
    const miso: Recipe = {
      ...baseRecipe,
      id: "recipe-2",
      name: "味噌汁",
      ingredients: [{ ...baseIngredient, id: "ingredient-2", recipe_id: "recipe-2", name: "豆腐" }]
    };

    renderWorkspace({ initialMealSchedules: [baseSchedule], initialRecipes: [baseRecipe, miso] });
    openScheduleView();

    fireEvent.click(screen.getAllByRole("button", { name: /朝に追加/ })[0]);
    const firstDialog = screen.getByRole("dialog");
    fireEvent.change(within(firstDialog).getByLabelText("レシピ検索"), { target: { value: "味噌" } });
    expect(within(firstDialog).queryByRole("button", { name: /カレー/ })).toBeNull();

    // 閉じて開き直すと picker 専用状態が初期化され、前回の検索語が残らない。
    fireEvent.click(within(firstDialog).getByRole("button", { name: "閉じる" }));
    fireEvent.click(screen.getAllByRole("button", { name: /朝に追加/ })[0]);
    const secondDialog = screen.getByRole("dialog");
    expect((within(secondDialog).getByLabelText("レシピ検索") as HTMLInputElement).value).toBe("");
    expect(within(secondDialog).getByRole("button", { name: /カレー/ })).toBeTruthy();
    expect(within(secondDialog).getByRole("button", { name: /味噌汁/ })).toBeTruthy();
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

  it("shows every scheduled meal in the same day and meal type slot", () => {
    const otherRecipe: Recipe = { ...baseRecipe, id: "recipe-2", name: "肉じゃが" };
    const sameSlotSchedule: MealSchedule = {
      ...baseSchedule,
      id: "schedule-2",
      recipe_id: "recipe-2",
      recipe_name: "肉じゃが"
    };

    renderWorkspace({
      initialMealSchedules: [baseSchedule, sameSlotSchedule],
      initialRecipes: [baseRecipe, otherRecipe]
    });
    openScheduleView();

    const scheduleBoard = screen.getByLabelText("7日献立");
    expect(within(scheduleBoard).getByRole("button", { name: "カレー の操作" })).toBeTruthy();
    expect(within(scheduleBoard).getByRole("button", { name: "肉じゃが の操作" })).toBeTruthy();
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
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を 2026/05/26 朝 へ移動しました。")).toBeTruthy();
  });

  it("deletes a meal schedule", async () => {
    const scheduleDelete = deleteQuery();
    const shoppingDelete = deleteShoppingByScheduleQuery([]);
    from.mockImplementation((table: string) => {
      if (table === "shopping_items") return { delete: shoppingDelete.deleteRows };
      if (table === "meal_schedules") return { delete: scheduleDelete.deleteRows };
      return {};
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(await screen.findByLabelText("削除確認")).toBeTruthy();
    fireEvent.click(within(screen.getByLabelText("削除確認")).getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("meal_schedules");
      expect(scheduleDelete.deleteRows).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
    // 関連買い物の削除（未購入のみ）も走る。
    expect(from).toHaveBeenCalledWith("shopping_items");
    expect(shoppingDelete.eqSchedule).toHaveBeenCalledWith("meal_schedule_id", "schedule-1");
    expect(shoppingDelete.eqStatus).toHaveBeenCalledWith("status", "未購入");
    // 関連が0件なら買い物の件数は文面に出さない。
    expect(await screen.findByText("カレー を献立から削除しました。")).toBeTruthy();
  });

  it("deletes related unpurchased shopping items when a schedule is deleted", async () => {
    const scheduleDelete = deleteQuery();
    const shoppingDelete = deleteShoppingByScheduleQuery([{ id: "shop-1" }, { id: "shop-2" }]);
    from.mockImplementation((table: string) => {
      if (table === "shopping_items") return { delete: shoppingDelete.deleteRows };
      if (table === "meal_schedules") return { delete: scheduleDelete.deleteRows };
      return {};
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    // 確認ダイアログに連動削除の旨が出る。
    const confirmDialog = await screen.findByLabelText("削除確認");
    expect(within(confirmDialog).getByText(/未購入の買い物リスト項目も一緒に削除します/)).toBeTruthy();
    fireEvent.click(within(confirmDialog).getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(shoppingDelete.deleteRows).toHaveBeenCalled();
      expect(scheduleDelete.deleteRows).toHaveBeenCalled();
    });
    expect(shoppingDelete.eqSchedule).toHaveBeenCalledWith("meal_schedule_id", "schedule-1");
    expect(shoppingDelete.eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(shoppingDelete.eqStatus).toHaveBeenCalledWith("status", "未購入");
    expect(await screen.findByText(/関連する未購入の買い物リスト 2件も削除しました。/)).toBeTruthy();
  });

  it("links shopping items to the schedule when added via the recipe-originated flow", async () => {
    // baseRecipe は玉ねぎ2個、baseInventory は1個 → 不足1個。登録後の不足モーダルからの追加で
    // meal_schedule_id（作成された献立 id）が買い物リストに保存される。
    const scheduleInsert = insertSingleQuery(baseSchedule);
    const shoppingInsert = insertListQuery([{ id: "shop-1" }]);
    from.mockImplementation((table: string) => {
      if (table === "meal_schedules") return { insert: scheduleInsert.insert };
      if (table === "shopping_items") return { insert: shoppingInsert.insert };
      return { insert: vi.fn() };
    });

    renderWorkspace({ initialMealSchedules: [baseSchedule] });

    fireEvent.click(screen.getAllByRole("button", { name: "スケジュールに追加" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: /を選ぶ$/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "朝" }));

    const shortageModal = await screen.findByRole("dialog", { name: "買い物に追加するもの" });
    fireEvent.click(within(shortageModal).getByLabelText("表示中をすべて選択"));
    fireEvent.click(within(shortageModal).getByRole("button", { name: /選択したものを追加/ }));

    await waitFor(() => {
      expect(shoppingInsert.insert).toHaveBeenCalledWith([
        expect.objectContaining({ name: "玉ねぎ", meal_schedule_id: "schedule-1" })
      ]);
    });
  });

  it("uncompletes a meal schedule and rolls inventory/history back", async () => {
    const completedSchedule: MealSchedule = {
      ...baseSchedule,
      status: "完了",
      completed_at: "2026-05-24T10:00:00.000Z"
    };
    const uncompletedSchedule: MealSchedule = {
      ...completedSchedule,
      status: "未完了",
      completed_at: null
    };
    const eventsSelect = selectEqQuery([{ stock_item_id: "stock-1", consumed_amount: 1 }]);
    const consumptionDelete = deleteQuery();
    const historyDelete = deleteQuery();
    const inventoryUpdate = updateEqQuery();
    const scheduleUpdate = updateSingleQuery(uncompletedSchedule);

    from.mockImplementation((table: string) => {
      if (table === "cooking_consumption_events") return { select: eventsSelect.select, delete: consumptionDelete.deleteRows };
      if (table === "inventory_items") return { update: inventoryUpdate.update };
      if (table === "cooking_history") return { delete: historyDelete.deleteRows };
      if (table === "meal_schedules") return { update: scheduleUpdate.update };
      return {};
    });

    renderWorkspace({ initialInventoryItems: [{ ...baseInventory, quantity: 0 }], initialMealSchedules: [completedSchedule] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "完了を外す" }));
    expect(await screen.findByLabelText("完了解除確認")).toBeTruthy();
    fireEvent.click(within(screen.getByLabelText("完了解除確認")).getByRole("button", { name: "完了を外す" }));

    await waitFor(() => {
      expect(eventsSelect.select).toHaveBeenCalledWith("stock_item_id, consumed_amount");
      expect(inventoryUpdate.update).toHaveBeenCalledWith({
        quantity: 1,
        archived_at: null,
        archived_reason: null
      });
      expect(consumptionDelete.deleteRows).toHaveBeenCalled();
      expect(historyDelete.deleteRows).toHaveBeenCalled();
      expect(scheduleUpdate.update).toHaveBeenCalledWith({ status: "未完了", completed_at: null });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー の完了を取り消し、在庫を戻しました。")).toBeTruthy();
  });

  it("deletes a completed meal schedule after rolling inventory/history back", async () => {
    const completedSchedule: MealSchedule = {
      ...baseSchedule,
      status: "完了",
      completed_at: "2026-05-24T10:00:00.000Z"
    };
    const eventsSelect = selectEqQuery([
      { stock_item_id: "stock-1", consumed_amount: 1 },
      { stock_item_id: null, consumed_amount: 10 }
    ]);
    const consumptionDelete = deleteQuery();
    const historyDelete = deleteQuery();
    const inventoryUpdate = updateEqQuery();
    const scheduleDelete = deleteQuery();
    const shoppingDelete = deleteShoppingByScheduleQuery([]);

    from.mockImplementation((table: string) => {
      if (table === "cooking_consumption_events") return { select: eventsSelect.select, delete: consumptionDelete.deleteRows };
      if (table === "inventory_items") return { update: inventoryUpdate.update };
      if (table === "cooking_history") return { delete: historyDelete.deleteRows };
      if (table === "shopping_items") return { delete: shoppingDelete.deleteRows };
      if (table === "meal_schedules") return { delete: scheduleDelete.deleteRows };
      return {};
    });

    renderWorkspace({ initialInventoryItems: [{ ...baseInventory, quantity: 0 }], initialMealSchedules: [completedSchedule] });
    openScheduleView();

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー を削除" }));
    expect(
      await screen.findByText(
        "在庫を戻して献立を削除します。料理履歴と消費記録も削除されます。完成写真は残ります。この予定に紐づく未購入の買い物リスト項目も一緒に削除します。"
      )
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(inventoryUpdate.update).toHaveBeenCalledTimes(1);
      expect(inventoryUpdate.update).toHaveBeenCalledWith({
        quantity: 1,
        archived_at: null,
        archived_reason: null
      });
      expect(consumptionDelete.deleteRows).toHaveBeenCalled();
      expect(historyDelete.deleteRows).toHaveBeenCalled();
      expect(scheduleDelete.deleteRows).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("カレー を献立から削除しました。")).toBeTruthy();
    expect(within(screen.getByLabelText("7日献立")).queryByText("カレー")).toBeNull();
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
      steps: ["玉ねぎを炒めて醤油 大さじ1を加える"],
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
    expect(within(viewer).getAllByText("2個").length).toBeGreaterThan(0);

    // 調味料タブで調味料に絞る。
    fireEvent.click(within(viewer).getByRole("button", { name: /^調味料/ }));
    expect(within(screen.getByLabelText("材料と在庫")).getByText("醤油")).toBeTruthy();

    // 手順は調理工程タブ、文中の材料はチップ化されてタップで照合できる。
    fireEvent.click(within(viewer).getByRole("button", { name: /^調理工程/ }));
    const stepChips = within(viewer).getAllByRole("button", { name: "玉ねぎ" });
    expect(stepChips.length).toBeGreaterThan(0);
    expect(viewer.querySelector('[aria-label="大さじ1"]')).toBeTruthy();
    expect(within(viewer).getAllByText("大さじ").length).toBeGreaterThan(0);
    expect(within(viewer).getAllByText("1").length).toBeGreaterThan(0);
    expect(within(viewer).queryByText("1大さじ")).toBeNull();
    fireEvent.click(stepChips[0]);

    // 全画面オーバーレイで開き、戻るで閉じられる（Canvas版同様）。
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    expect(overlay).toBeTruthy();
    fireEvent.click(within(overlay).getByRole("button", { name: "戻る" }));
    expect(screen.queryByLabelText("調理ビューア")).toBeNull();
    expect(shellMocks.returnToMode).not.toHaveBeenCalled();
  });

  it("shows recipe photo toggle in cooking overlay, toggling hides and restores the photo block", () => {
    renderWorkspace({ initialRecipes: [baseRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    // 初期状態: 開いている（aria-expanded="true"）
    const toggleBtn = within(overlay).getByRole("button", { name: "レシピ写真を隠す" });
    expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

    // 写真ブロックがある（写真未登録なのでプレースホルダ）
    expect(within(overlay).getByRole("img", { name: baseRecipe.name })).toBeTruthy();

    // トグルで閉じる
    fireEvent.click(toggleBtn);
    const reopenBtn = within(overlay).getByRole("button", { name: "レシピ写真を表示" });
    expect(reopenBtn.getAttribute("aria-expanded")).toBe("false");
    // 写真サムネイルが消える
    expect(within(overlay).queryByRole("img", { name: baseRecipe.name })).toBeNull();

    // 再び開く
    fireEvent.click(reopenBtn);
    expect(within(overlay).getByRole("button", { name: "レシピ写真を隠す" }).getAttribute("aria-expanded")).toBe("true");
    expect(within(overlay).getByRole("img", { name: baseRecipe.name })).toBeTruthy();
  });

  it("shows YouTube player initially and lets switching back to the photo when source has a video URL", () => {
    const youtubeRecipe: Recipe = {
      ...baseRecipe,
      source: "家庭メモ\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ"
    };
    const { container } = renderWorkspace({ initialRecipes: [youtubeRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    // 動画が初期表示される
    const iframe = container.querySelector('iframe[src*="youtube-nocookie.com/embed/"]');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(iframe?.getAttribute("title")).toContain("カレー");
    expect(iframe?.hasAttribute("allowfullscreen")).toBe(true);
    // 動画初期表示なので写真サムネイルは出ていない
    expect(within(overlay).queryByRole("img", { name: youtubeRecipe.name })).toBeNull();

    // 切替UIで写真へ戻す
    fireEvent.click(within(overlay).getByRole("button", { name: "写真を表示" }));
    expect(container.querySelector('iframe[src*="youtube-nocookie.com/embed/"]')).toBeNull();
    expect(within(overlay).getByRole("img", { name: youtubeRecipe.name })).toBeTruthy();

    // 動画へ戻せる
    fireEvent.click(within(overlay).getByRole("button", { name: "動画を表示" }));
    expect(container.querySelector('iframe[src*="youtube-nocookie.com/embed/"]')).not.toBeNull();
  });

  it("hides the media switch and renders no iframe when source has no YouTube URL", () => {
    const { container } = renderWorkspace({ initialRecipes: [baseRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    expect(container.querySelector('iframe[src*="youtube-nocookie.com/embed/"]')).toBeNull();
    expect(within(overlay).queryByRole("button", { name: "動画を表示" })).toBeNull();
    expect(within(overlay).queryByRole("button", { name: "写真を表示" })).toBeNull();
    // 従来どおり写真（プレースホルダ）が出る
    expect(within(overlay).getByRole("img", { name: baseRecipe.name })).toBeTruthy();
  });

  it("resets photo toggle to open when reopening cooking viewer", () => {
    renderWorkspace({ initialRecipes: [baseRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    const toggleBtn = within(overlay).getByRole("button", { name: "レシピ写真を隠す" });

    // 閉じる
    fireEvent.click(toggleBtn);
    expect(within(overlay).getByRole("button", { name: "レシピ写真を表示" })).toBeTruthy();

    // 調理ビューを戻る
    fireEvent.click(within(overlay).getByRole("button", { name: "戻る" }));

    // もう一度開く
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const newOverlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    // 初期状態が「開いている」に戻っている
    const reopenToggle = within(newOverlay).getByRole("button", { name: "レシピ写真を隠す" });
    expect(reopenToggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("saves cooking step reorder changes back to the recipe", async () => {
    const recipeUpdate = updateSingleQuery({
      ...baseRecipe,
      prep_steps: [],
      steps: ["煮る", "切る"],
      updated_at: "2026-05-28T12:30:00.000Z"
    });

    from.mockImplementation((table: string) => {
      if (table === "recipes") return { update: recipeUpdate.update };
      return {};
    });

    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    const dataTransfer = dragDataTransfer();
    const prepCard = within(overlay).getByText("切る").closest("article") as HTMLElement;
    const cookGroup = overlay.querySelectorAll(".cooking-step-group")[1] as HTMLElement;
    fireEvent.dragStart(prepCard, { dataTransfer });
    fireEvent.drop(cookGroup, { dataTransfer });
    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(recipeUpdate.update).toHaveBeenCalledWith({
        prep_steps: [],
        steps: ["煮る", "切る"]
      });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("saves cooking ingredient reorder changes back to the recipe", async () => {
    const secondIngredient: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-2",
      name: "にんじん",
      sort_order: 1
    };
    const ingredientUpdate = updateTripleEqQuery();

    from.mockImplementation((table: string) => {
      if (table === "recipe_ingredients") return { update: ingredientUpdate.update };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, secondIngredient] }] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    const dataTransfer = dragDataTransfer();
    const carrotCard = within(overlay).getByText("にんじん").closest("article") as HTMLElement;
    const onionCard = within(overlay).getByText("玉ねぎ").closest("article") as HTMLElement;
    fireEvent.dragStart(carrotCard, { dataTransfer });
    fireEvent.drop(onionCard, { dataTransfer });
    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 0, group_index: 0 });
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 1, group_index: 0 });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("confirms before committing a cooking reorder and cancels without saving", async () => {
    const secondIngredient: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-2",
      name: "にんじん",
      sort_order: 1
    };
    const ingredientUpdate = updateTripleEqQuery();

    from.mockImplementation((table: string) => {
      if (table === "recipe_ingredients") return { update: ingredientUpdate.update };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, secondIngredient] }] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    const dataTransfer = dragDataTransfer();
    const carrotCard = within(overlay).getByText("にんじん").closest("article") as HTMLElement;
    const onionCard = within(overlay).getByText("玉ねぎ").closest("article") as HTMLElement;
    fireEvent.dragStart(carrotCard, { dataTransfer });
    fireEvent.drop(onionCard, { dataTransfer });

    // 確定ボタンは保存前に確認を出す。やめるを押すと保存されず未確定のまま残る。
    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    expect(screen.getByRole("alertdialog", { name: "並び替え確認" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "やめる" }));
    expect(ingredientUpdate.update).not.toHaveBeenCalled();
    expect(within(overlay).getByRole("button", { name: "並び替えを確定" })).toBeTruthy();

    // もう一度確定し、今度は確認OKで既存の保存フローが走る。
    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 0, group_index: 0 });
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 1, group_index: 0 });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("moves ingredients across food and seasoning groups with undo and redo", async () => {
    const seasoning: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-seasoning",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 1
    };
    const ingredientUpdate = updateTripleEqQuery();

    from.mockImplementation((table: string) => {
      if (table === "recipe_ingredients") return { update: ingredientUpdate.update };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, seasoning] }] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    const foodGroup = overlay.querySelectorAll(".cooking-ing-group")[0] as HTMLElement;
    const seasoningCard = within(overlay).getByText("塩").closest("article") as HTMLElement;
    const dataTransfer = dragDataTransfer();

    fireEvent.dragStart(seasoningCard, { dataTransfer });
    fireEvent.drop(foodGroup, { dataTransfer });
    expect(within(overlay).getByText("塩").closest("article")?.getAttribute("data-changed")).toBe("true");

    fireEvent.click(within(overlay).getByRole("button", { name: "Undo" }));
    expect(within(overlay).getByText("塩").closest("article")?.getAttribute("data-changed")).toBe("false");

    fireEvent.click(within(overlay).getByRole("button", { name: "Redo" }));
    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 1, group_index: 0 });
      expect(refresh).toHaveBeenCalled();
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("groups selected ingredients into a subgroup and persists group_index", async () => {
    const carrot: RecipeIngredient = { ...baseIngredient, id: "ingredient-2", name: "にんじん", sort_order: 1 };
    const salt: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 2
    };
    const ingredientUpdate = updateTripleEqQuery();
    from.mockImplementation((table: string) => {
      if (table === "recipe_ingredients") return { update: ingredientUpdate.update };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, carrot, salt] }] });
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    // 1件目はプレーンクリック、2件目はCmd/Ctrlクリックで複数選択。
    fireEvent.click(within(overlay).getByText("玉ねぎ").closest("article") as HTMLElement);
    fireEvent.click(within(overlay).getByText("にんじん").closest("article") as HTMLElement, { metaKey: true });

    // 2件以上の選択でラベル隣にグルーピングボタンが出る。
    fireEvent.click(within(overlay).getByRole("button", { name: "グルーピング" }));

    // サブグループ見出しが自動採番(材料=A)で表示される。
    expect(within(overlay).getByText("A")).toBeTruthy();

    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 0, group_index: 1 });
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 1, group_index: 1 });
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "調味料", sort_order: 2, group_index: 0 });
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("ungroups a subgroup back to group_index 0 via the 解除 button", async () => {
    const carrot: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-2",
      name: "にんじん",
      sort_order: 1,
      group_index: 1
    };
    const groupedOnion: RecipeIngredient = { ...baseIngredient, group_index: 1 };
    const ingredientUpdate = updateTripleEqQuery();
    from.mockImplementation((table: string) => {
      if (table === "recipe_ingredients") return { update: ingredientUpdate.update };
      return {};
    });

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [groupedOnion, carrot] }] });
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    // 既存サブグループの見出し「A」と「解除」ボタンが出ている。
    expect(within(overlay).getByText("A")).toBeTruthy();
    fireEvent.click(within(overlay).getByRole("button", { name: "解除" }));

    fireEvent.click(within(overlay).getByRole("button", { name: "並び替えを確定" }));
    fireEvent.click(screen.getByRole("button", { name: "並びを確定" }));

    await waitFor(() => {
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 0, group_index: 0 });
      expect(ingredientUpdate.update).toHaveBeenCalledWith({ item_type: "食材", sort_order: 1, group_index: 0 });
    });
    expect(await screen.findByText("並び替えを保存しました。")).toBeTruthy();
  });

  it("limits subgroup selection to a single item_type", () => {
    const salt: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "塩",
      amount: 1,
      unit: "小さじ",
      sort_order: 1
    };

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, salt] }] });
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    // 材料を選び、Cmdクリックで調味料を足しても item_type 混在は不可＝選択は切り替わる。
    fireEvent.click(within(overlay).getByText("玉ねぎ").closest("article") as HTMLElement);
    fireEvent.click(within(overlay).getByText("塩").closest("article") as HTMLElement, { metaKey: true });

    // 単一選択しか残らないのでグルーピングボタンは出ない。
    expect(within(overlay).queryByRole("button", { name: "グルーピング" })).toBeNull();
    expect((within(overlay).getByText("塩").closest("article") as HTMLElement).getAttribute("data-selected")).toBe("true");
    expect((within(overlay).getByText("玉ねぎ").closest("article") as HTMLElement).getAttribute("data-selected")).toBe("false");
  });

  it("labels seasoning subgroups with hiragana", () => {
    const soy: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-3",
      item_type: "調味料",
      name: "醤油",
      amount: 1,
      unit: "大さじ",
      sort_order: 1
    };
    const mirin: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-4",
      item_type: "調味料",
      name: "みりん",
      amount: 1,
      unit: "大さじ",
      sort_order: 2
    };

    renderWorkspace({ initialRecipes: [{ ...baseRecipe, ingredients: [baseIngredient, soy, mirin] }] });
    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));
    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });

    fireEvent.click(within(overlay).getByText("醤油").closest("article") as HTMLElement);
    fireEvent.click(within(overlay).getByText("みりん").closest("article") as HTMLElement, { metaKey: true });
    fireEvent.click(within(overlay).getByRole("button", { name: "グルーピング" }));

    // 調味料の自動採番はひらがな（あ）。
    expect(within(overlay).getByText("あ")).toBeTruthy();
  });

  it("renders multiple source URLs as separate links in the cooking overlay", () => {
    const sourcedRecipe: Recipe = {
      ...baseRecipe,
      source: "https://a.example.com/recipe/1\nhttps://b.example.com/recipe/2\n料理本のメモ"
    };

    renderWorkspace({ initialRecipes: [sourcedRecipe] });

    fireEvent.click(screen.getByRole("button", { name: "調理ビューを開く" }));

    const overlay = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    const firstLink = within(overlay).getByRole("link", { name: "https://a.example.com/recipe/1" });
    const secondLink = within(overlay).getByRole("link", { name: "https://b.example.com/recipe/2" });
    expect(firstLink.getAttribute("href")).toBe("https://a.example.com/recipe/1");
    expect(secondLink.getAttribute("href")).toBe("https://b.example.com/recipe/2");
    // URLでない出典（本の名前）はリンク化せずテキスト表示する。
    expect(within(overlay).getByText("料理本のメモ")).toBeTruthy();
    expect(within(overlay).queryByRole("link", { name: "料理本のメモ" })).toBeNull();
  });

  it("returns to cooking records when the viewer was opened from history", async () => {
    shellMocks.pendingRecipeId = "recipe-1";
    shellMocks.pendingRecipeOrigin = "cooking";

    renderWorkspace();

    const overlay = await screen.findByRole("dialog", { name: "調理ビューア全画面" });
    expect(shellMocks.clearPendingRecipe).toHaveBeenCalled();

    fireEvent.click(within(overlay).getByRole("button", { name: "戻る" }));
    expect(shellMocks.returnToMode).toHaveBeenCalledWith("cooking");
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
      expect(inventoryUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0,
          archived_reason: "cooking_zero"
        })
      );
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

  it("excludes a row by setting consumption to 0 and saves rating/comment with cooking history", async () => {
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

    fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
    fireEvent.click(screen.getByRole("button", { name: "調理を開始" }));
    const cookingViewer = screen.getByRole("dialog", { name: "調理ビューア全画面" });
    fireEvent.click(within(cookingViewer).getByRole("button", { name: "料理を完了する" }));

    const consumptionModal = await screen.findByRole("dialog", { name: "実際の消費量を調整" });
    expect(within(consumptionModal).getByRole("tab", { name: "全" })).toBeTruthy();
    expect(within(consumptionModal).getByRole("button", { name: "全部 既定量" })).toBeTruthy();
    expect(within(consumptionModal).getByRole("button", { name: "全部 0" })).toBeTruthy();
    fireEvent.change(within(consumptionModal).getByLabelText("消費量"), { target: { value: "2" } });
    expect(within(consumptionModal).getByText(/在庫不足: 玉ねぎ/)).toBeTruthy();

    // チェックボックスは廃止。消費量を0にすることで在庫減算から除外する。
    fireEvent.change(within(consumptionModal).getByLabelText("消費量"), { target: { value: "0" } });
    fireEvent.click(within(consumptionModal).getAllByRole("button", { name: "★" })[3]);
    fireEvent.change(within(consumptionModal).getByLabelText("一言コメント"), { target: { value: "家族に好評" } });
    fireEvent.click(within(consumptionModal).getByRole("button", { name: "確定" }));

    await waitFor(() => {
      expect(inventoryUpdate.update).not.toHaveBeenCalled();
      expect(historyInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          note: "家族に好評",
          rating: 4
        })
      );
      expect(consumptionInsert).not.toHaveBeenCalled();
    });
  });

  it("does not save invalid recipe values", async () => {
    renderWorkspace({ initialRecipes: [] });
    openRecipeEditor();

    fireEvent.click(screen.getByRole("button", { name: "レシピを保存" }));

    expect(await screen.findByText(/原因: レシピ名が未入力です。/)).toBeTruthy();
    expect(from).not.toHaveBeenCalled();
  });
});
