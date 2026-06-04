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
    expect(shellMocks.returnToMode).not.toHaveBeenCalled();
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
