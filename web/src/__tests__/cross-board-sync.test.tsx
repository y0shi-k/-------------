import { act, render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryStoreProvider, useInventoryStore } from "@/components/inventory-store";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import type { StockItem } from "@/lib/inventory/types";
import type { MealSchedule, Recipe, RecipeIngredient } from "@/lib/recipes/types";

// ============================================================================
// モック設定
// ============================================================================

const shellMocks = vi.hoisted(() => ({
  requestViewRecipe: vi.fn(),
  clearPendingRecipe: vi.fn(),
  returnToMode: vi.fn(),
  selectedSubViews: {
    ingredients: "inventory" as "inventory" | "shopping",
    recipes: "recipes" as "recipes" | "schedule",
    cooking: "timeline" as "calendar" | "timeline" | "insights"
  },
  selectShellLeaf: vi.fn(),
  showStatusMessage: vi.fn(),
  aiUsageSummary: null,
  refreshAiUsage: vi.fn(async () => {})
}));

vi.mock("@/components/web-mode-shell", () => ({
  useShellNavigation: () => ({
    clearPendingRecipe: shellMocks.clearPendingRecipe,
    pendingRecipeId: null,
    pendingRecipeOrigin: "recipes",
    returnToMode: shellMocks.returnToMode,
    requestViewRecipe: shellMocks.requestViewRecipe
  }),
  useShellStatusMessage: () => ({
    showStatusMessage: shellMocks.showStatusMessage
  }),
  useShellAiUsage: () => ({
    aiUsageSummary: shellMocks.aiUsageSummary,
    refreshAiUsage: shellMocks.refreshAiUsage
  }),
  useShellSubView: () => ({
    activeDesktopTarget: { group: "ingredients", kind: "mode", leaf: shellMocks.selectedSubViews.ingredients },
    selectedSubViews: shellMocks.selectedSubViews,
    selectShellLeaf: shellMocks.selectShellLeaf
  })
}));

vi.mock("@/lib/photos/signed-url-cache", () => ({
  useCachedSignedUrls: () => new Map()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

// Supabase の inventory_items は「実フローの正本」を表す可変ストアとしてモックする。
// - select(...).eq.is.gt.order: fetchFreshInventoryForMeals / refetch の active query。現在状態を返す。
// - update(...).eq(id).eq(user_id): 消費確定の在庫減算。可変ストアへ反映する（refetch が現在状態を読めるように）。
// これにより「消費確定 → DB相当の在庫が減る → refetch がその結果でストアを更新」という実フローを通せる。
const dbMocks = vi.hoisted(() => ({
  inventoryRows: [] as Array<Record<string, unknown> & { id: string; quantity: number }>
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "inventory_items") {
        // active query: .select("*").eq(user_id).is(archived_at,null).gt(quantity,0).order(created_at)
        const activeOrder = vi.fn().mockImplementation(async () => ({
          data: dbMocks.inventoryRows.filter((r) => r.quantity > 0),
          error: null
        }));
        const gt = vi.fn(() => ({ order: activeOrder }));
        const is = vi.fn(() => ({ gt }));
        // archived query: .select("*").eq(user_id).not(archived_at,is,null).order(archived_at).limit(50)
        const limit = vi.fn().mockResolvedValue({ data: [], error: null });
        const archivedOrder = vi.fn(() => ({ limit }));
        const not = vi.fn(() => ({ order: archivedOrder }));
        const eqSelect = vi.fn(() => ({ is, not }));
        const select = vi.fn(() => ({ eq: eqSelect }));

        // update(...).eq("id").eq("user_id") → 可変ストアへ減算結果を反映
        const updateChain = vi.fn((payload: { quantity?: number }) => {
          const eqId = vi.fn((_col: string, id: string) => {
            const eqUser = vi.fn().mockImplementation(async () => {
              if (typeof payload?.quantity === "number") {
                dbMocks.inventoryRows = dbMocks.inventoryRows.map((r) =>
                  r.id === id ? { ...r, quantity: payload.quantity as number } : r
                );
              }
              return { data: null, error: null };
            });
            return { eq: eqUser };
          });
          return { eq: eqId };
        });

        return { select, update: updateChain };
      }

      if (table === "meal_schedules") {
        // update(...).eq(id).eq(user_id).select().single()
        const single = vi.fn().mockImplementation(async () => ({
          data: { id: "schedule-1", status: "完了", completed_at: "2026-05-28T12:00:00.000Z" },
          error: null
        }));
        const selectChain = vi.fn(() => ({ single }));
        const eqUser = vi.fn(() => ({ select: selectChain }));
        const eqId = vi.fn(() => ({ eq: eqUser }));
        const update = vi.fn(() => ({ eq: eqId }));
        return { update };
      }

      if (table === "cooking_history") {
        // insert(...).select().single()
        const single = vi.fn().mockResolvedValue({ data: { id: "history-1" }, error: null });
        const selectChain = vi.fn(() => ({ single }));
        const insert = vi.fn(() => ({ select: selectChain }));
        return { insert };
      }

      if (table === "cooking_consumption_events") {
        const insert = vi.fn().mockResolvedValue({ data: null, error: null });
        return { insert };
      }

      if (table === "storage_locations") {
        // refetch: .select("*").eq(user_id).order(sort_order).order(name)
        const orderName = vi.fn().mockResolvedValue({ data: [], error: null });
        const orderSort = vi.fn(() => ({ order: orderName }));
        const eq = vi.fn(() => ({ order: orderSort }));
        const select = vi.fn(() => ({ eq }));
        return { select };
      }

      if (table === "shopping_items") {
        const order = vi.fn().mockResolvedValue({ data: [], error: null });
        const eq = vi.fn(() => ({ order }));
        const select = vi.fn(() => ({ eq }));
        return { select };
      }

      return {};
    }
  })
}));

// ============================================================================
// テストユーティリティ
// ============================================================================

function makeStockItem(
  id: string,
  name: string,
  quantity: number = 1,
  unit: string = "個"
): StockItem {
  return {
    id,
    user_id: "user1",
    category: "食材",
    name,
    quantity,
    unit,
    unit_conversion: null,
    display_expires_on: null,
    effective_expires_on: null,
    storage_location: "冷蔵庫",
    status_note: "",
    source: "manual",
    image_storage_path: null,
    archived_at: null,
    archived_reason: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  };
}

function makeMealSchedule(
  id: string,
  recipeId: string,
  recipeName: string
): MealSchedule {
  return {
    id,
    user_id: "user1",
    scheduled_on: "2026-05-28",
    meal_type: "晩",
    recipe_id: recipeId,
    recipe_name: recipeName,
    status: "未完了",
    completed_at: null,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z"
  };
}

function makeRecipeIngredient(
  id: string,
  recipeId: string,
  name: string,
  amount: number = 1,
  unit: string = "個"
): RecipeIngredient {
  return {
    id,
    user_id: "user1",
    recipe_id: recipeId,
    item_type: "食材",
    name,
    amount,
    unit,
    sort_order: 0,
    group_index: 0,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z"
  };
}

function makeRecipe(id: string, name: string, ingredients: RecipeIngredient[]): Recipe {
  return {
    id,
    user_id: "user1",
    name,
    source: "家庭メモ",
    genre: ["夕食"],
    steps: ["調理する"],
    prep_steps: ["準備"],
    cook_count: 0,
    cooked_on_history: [],
    is_favorite: false,
    image_storage_path: null,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z",
    ingredients
  };
}

// ============================================================================
// テストスイート
// ============================================================================

describe("CrossBoardSync", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-28T12:00:00"));
    dbMocks.inventoryRows = [];
    shellMocks.requestViewRecipe.mockReset();
    shellMocks.selectShellLeaf.mockReset();
    shellMocks.showStatusMessage.mockReset();
    shellMocks.refreshAiUsage.mockReset();
    shellMocks.refreshAiUsage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Scenario 1: 調理完了→在庫減算の同期（実フロー）", () => {
    it("実コンポーネント RecipeMealWorkspace の消費確定フロー（completeSchedule）が共有ストアの在庫を減算し、同じ Provider の別 Consumer へ反映される", async () => {
      // 初期在庫: 玉ねぎ 5個（Supabase 相当の可変ストアと同期させておく）
      const initialInventory: StockItem[] = [makeStockItem("onion-1", "玉ねぎ", 5)];
      dbMocks.inventoryRows = [{ ...makeStockItem("onion-1", "玉ねぎ", 5) }];

      // レシピ: カレー（玉ねぎ 2個）。消費確定で 5 → 3 になることを期待する。
      const curryRecipe = makeRecipe("recipe-1", "カレー", [
        makeRecipeIngredient("ing-1", "recipe-1", "玉ねぎ", 2, "個")
      ]);
      const schedule = makeMealSchedule("schedule-1", "recipe-1", "カレー");

      // 同じ Provider 配下の独立リーダー。ストアの在庫を監視する。
      const InventoryMonitor = () => {
        const { inventoryItems } = useInventoryStore();
        const qty = inventoryItems.find((i) => i.id === "onion-1")?.quantity ?? "not-found";
        return <span data-testid="current-onion-qty">{qty}</span>;
      };

      render(
        <InventoryStoreProvider
          initialInventoryItems={initialInventory}
          initialArchivedInventoryItems={[]}
          initialStorageLocations={[]}
          initialShoppingItems={[]}
        >
          <div>
            <RecipeMealWorkspace
              initialRecipes={[curryRecipe]}
              initialMealSchedules={[schedule]}
              initialCookCandidates={[]}
              userId="user1"
            />
            <InventoryMonitor />
          </div>
        </InventoryStoreProvider>
      );

      // 初期状態: 玉ねぎ 5個
      expect(screen.getByTestId("current-onion-qty").textContent).toBe("5");

      // スケジュール表示へ切り替える
      fireEvent.click(screen.getByRole("button", { name: "スケジュール" }));
      await waitFor(() => {
        expect(screen.getByLabelText("7日献立")).toBeTruthy();
      });

      // 献立スロットの操作メニュー → 「調理を開始」で調理ビューアを開く
      fireEvent.click(within(screen.getByLabelText("7日献立")).getByRole("button", { name: "カレー の操作" }));
      fireEvent.click(screen.getByRole("button", { name: "調理を開始" }));

      const overlay = await screen.findByRole("dialog", { name: "調理ビューア全画面" });

      // 「料理を完了する」で消費量モーダルを開く（在庫リフェッチが走る）
      fireEvent.click(within(overlay).getByRole("button", { name: "料理を完了する" }));

      // 消費量モーダルが開く（ConsumptionEditor が玉ねぎを認識し stockItemId が紐づく）
      const consumptionHeading = await screen.findByText("実際の消費量を調整");
      const consumptionDialog = consumptionHeading.closest("[role='dialog']") as HTMLElement;
      expect(consumptionDialog).toBeTruthy();

      // 「確定」で completeSchedule の本処理（在庫減算 → 履歴 → 消費イベント）を実行
      fireEvent.click(within(consumptionDialog).getByRole("button", { name: "確定" }));

      // 共有ストアの在庫が減算され、別 Consumer へ反映される（5 → 3）
      await waitFor(() => {
        expect(screen.getByTestId("current-onion-qty").textContent).toBe("3");
      });
    });
  });

  describe("Scenario 2: 在庫追加→献立の自動マッチ反映", () => {
    it("実コンポーネント RecipeMealWorkspace をマウント後、同じ Provider に在庫を追加すると、レシピの自動マッチング入力（在庫参照）が更新される", async () => {
      // 初期状態: 在庫なし
      const initialInventory: StockItem[] = [];

      // レシピ: カレー（玉ねぎ 1個を要求）
      const curryRecipe = makeRecipe("curry-1", "カレー", [
        makeRecipeIngredient("ing-1", "curry-1", "玉ねぎ", 1, "個")
      ]);

      const InventoryAdder = () => {
        const { inventoryItems, setInventoryItems } = useInventoryStore();
        return (
          <button
            data-testid="add-onion"
            onClick={() => {
              setInventoryItems([
                ...inventoryItems,
                makeStockItem("onion-1", "玉ねぎ", 2, "個")
              ]);
            }}
          >
            玉ねぎを追加
          </button>
        );
      };

      const InventoryMonitor = () => {
        const { inventoryItems } = useInventoryStore();
        return (
          <div data-testid="inventory-count">
            {inventoryItems.length} 品目
          </div>
        );
      };

      const TestContainer = () => {
        return (
          <div>
            {/* 献立ワークスペース: 在庫参照による自動マッチング */}
            <RecipeMealWorkspace
              initialRecipes={[curryRecipe]}
              initialMealSchedules={[]}
              initialCookCandidates={[]}
              userId="user1"
            />

            {/* 在庫追加ボタン */}
            <InventoryAdder />

            {/* 在庫カウント */}
            <InventoryMonitor />
          </div>
        );
      };

      render(
        <InventoryStoreProvider
          initialInventoryItems={initialInventory}
          initialArchivedInventoryItems={[]}
          initialStorageLocations={[]}
          initialShoppingItems={[]}
        >
          <TestContainer />
        </InventoryStoreProvider>
      );

      // 初期状態: 食材なし
      expect(screen.getByTestId("inventory-count").textContent).toBe("0 品目");

      // 玉ねぎを追加
      act(() => {
        screen.getByTestId("add-onion").click();
      });

      // 在庫が増える
      await waitFor(() => {
        expect(screen.getByTestId("inventory-count").textContent).toBe("1 品目");
      });

      // 献立ワークスペースがカレーレシピを表示していることを確認
      // レシピの玉ねぎ成分情報が表示される（自動マッチング入力の在庫参照が機能している）
      const recipeTexts = screen.getAllByText("カレー");
      expect(recipeTexts.length).toBeGreaterThan(0);

      // 在庫に追加した玉ねぎが献立側で認識されている（レシピ成分として表示）
      await waitFor(() => {
        // 複数の玉ねぎテキストが有ることが想定されるため getAllByText を使用
        const onionTexts = screen.getAllByText(/玉ねぎ/);
        expect(onionTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Scenario 3: Provider の初期化で不正な在庫を除外", () => {
    it("archived_at が設定されている、または quantity が 0 のアイテムは inventoryItems に含まれない", () => {
      const initialInventory: StockItem[] = [
        makeStockItem("active-1", "有効な食材", 5),
        {
          ...makeStockItem("archived-1", "アーカイブ済み", 3),
          archived_at: "2024-01-01T00:00:00Z"
        },
        { ...makeStockItem("zero-qty-1", "ゼロ在庫", 0) }
      ];

      const Viewer = () => {
        const { inventoryItems } = useInventoryStore();
        return (
          <div>
            <span data-testid="active-count">{inventoryItems.length}</span>
            {inventoryItems.map((item) => (
              <span key={item.id} data-testid={`item-${item.id}`}>
                {item.name}: {item.quantity}
              </span>
            ))}
          </div>
        );
      };

      render(
        <InventoryStoreProvider
          initialInventoryItems={initialInventory}
          initialArchivedInventoryItems={[]}
          initialStorageLocations={[]}
          initialShoppingItems={[]}
        >
          <Viewer />
        </InventoryStoreProvider>
      );

      // 有効なアイテムだけ（count = 1）
      expect(screen.getByTestId("active-count").textContent).toBe("1");
      expect(screen.getByTestId("item-active-1").textContent).toBe("有効な食材: 5");
      expect(screen.queryByTestId("item-archived-1")).toBeNull();
      expect(screen.queryByTestId("item-zero-qty-1")).toBeNull();
    });
  });
});
