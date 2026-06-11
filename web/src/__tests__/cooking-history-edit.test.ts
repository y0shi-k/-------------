import { describe, expect, it } from "vitest";
import { applyAdjustmentsToQuantities, buildDraftsFromRecipeIngredients, buildEditDrafts, computeInventoryAdjustments } from "@/lib/cooking-history/edit";
import type { CookingConsumptionEvent } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";
import type { RecipeIngredient } from "@/lib/recipes/types";

const baseEvent: CookingConsumptionEvent = {
  id: "event-1",
  user_id: "user-1",
  cooking_history_id: "history-1",
  meal_schedule_id: null,
  recipe_id: "recipe-1",
  ingredient_name: "牛肉",
  requested_amount: 200,
  requested_unit: "g",
  consumed_amount: 200,
  consumed_unit: "g",
  stock_item_id: "stock-a",
  stock_item_name: "牛肉パック",
  substitute_for: "",
  created_at: "2026-06-01T00:00:00.000Z"
};

const baseStockItem: StockItem = {
  id: "stock-a",
  user_id: "user-1",
  category: "食材",
  name: "牛肉パック",
  quantity: 300,
  unit: "g",
  unit_conversion: null,
  display_expires_on: null,
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "",
  source: "manual",
  image_storage_path: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z"
};

const baseIngredient: RecipeIngredient = {
  id: "ingredient-1",
  user_id: "user-1",
  recipe_id: "recipe-1",
  item_type: "食材",
  name: "牛肉パック",
  amount: 200,
  unit: "g",
  sort_order: 1,
  group_index: 0,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z"
};

describe("cooking history edit helpers", () => {
  it("builds editable drafts from saved consumption events", () => {
    expect(buildEditDrafts([baseEvent])).toEqual([
      expect.objectContaining({
        id: "event-1",
        ingredientName: "牛肉",
        originalConsumedAmount: 200,
        originalStockItemId: "stock-a",
        stockItemId: "stock-a",
        amount: "200",
        selected: true
      })
    ]);
  });

  it("returns inventory when consumption is decreased on the same stock item", () => {
    const [draft] = buildEditDrafts([baseEvent]);
    const adjustments = computeInventoryAdjustments([{ ...draft, amount: "150" }]);

    expect(adjustments).toEqual([{ stockItemId: "stock-a", deltaQuantity: 50 }]);
  });

  it("decreases inventory when consumption is increased on the same stock item", () => {
    const [draft] = buildEditDrafts([baseEvent]);
    const adjustments = computeInventoryAdjustments([{ ...draft, amount: "300" }]);

    expect(adjustments).toEqual([{ stockItemId: "stock-a", deltaQuantity: -100 }]);
  });

  it("returns old stock and consumes new stock when stock item is changed", () => {
    const [draft] = buildEditDrafts([baseEvent]);
    const adjustments = computeInventoryAdjustments([{ ...draft, amount: "150", stockItemId: "stock-b" }]);

    expect(adjustments).toEqual([
      { stockItemId: "stock-a", deltaQuantity: 200 },
      { stockItemId: "stock-b", deltaQuantity: -150 }
    ]);
  });

  it("returns old stock when a consumption row is removed", () => {
    const [draft] = buildEditDrafts([baseEvent]);
    const adjustments = computeInventoryAdjustments([{ ...draft, selected: false }]);

    expect(adjustments).toEqual([{ stockItemId: "stock-a", deltaQuantity: 200 }]);
  });

  it("clamps updated quantity at zero and marks missing stock items", () => {
    const updates = applyAdjustmentsToQuantities(
      [{ ...baseStockItem, quantity: 20 }],
      [
        { stockItemId: "stock-a", deltaQuantity: -100 },
        { stockItemId: "deleted-stock", deltaQuantity: 50 }
      ]
    );

    expect(updates).toEqual([
      { id: "stock-a", missing: false, previousQuantity: 20, nextQuantity: 0 },
      { id: "deleted-stock", missing: true, previousQuantity: 0, nextQuantity: 0 }
    ]);
  });

  it("rebuilds new editable drafts from recipe ingredients when no consumption events exist", () => {
    const [draft] = buildDraftsFromRecipeIngredients([baseIngredient], [{ ...baseStockItem, quantity: 150 }]);

    expect(draft).toEqual(
      expect.objectContaining({
        id: "new-ingredient-1",
        isNew: true,
        ingredientName: "牛肉パック",
        requestedAmount: 200,
        originalConsumedAmount: 0,
        originalStockItemId: "",
        stockItemId: "stock-a",
        amount: "150",
        selected: true
      })
    );
    expect(computeInventoryAdjustments([draft])).toEqual([{ stockItemId: "stock-a", deltaQuantity: -150 }]);
  });

  it("classifies drafts as 調味料 by matching recipe ingredients name and unit", () => {
    const seasoningEvent: CookingConsumptionEvent = {
      ...baseEvent,
      id: "event-2",
      ingredient_name: "醤油",
      requested_unit: "ml",
      consumed_unit: "ml",
      stock_item_id: null,
      stock_item_name: ""
    };
    const seasoningIngredient: RecipeIngredient = {
      ...baseIngredient,
      id: "ingredient-2",
      item_type: "調味料",
      name: "醤油",
      unit: "ml"
    };

    const [draft] = buildEditDrafts([seasoningEvent], [seasoningIngredient]);

    expect(draft.item_type).toBe("調味料");
  });

  it("falls back to 食材 when no matching recipe ingredient is provided", () => {
    expect(buildEditDrafts([baseEvent])[0].item_type).toBe("食材");
    expect(buildEditDrafts([baseEvent], [])[0].item_type).toBe("食材");
  });

  it("carries item_type from recipe ingredients when rebuilding drafts", () => {
    const seasoning: RecipeIngredient = { ...baseIngredient, item_type: "調味料", name: "砂糖", unit: "g" };
    const [draft] = buildDraftsFromRecipeIngredients([seasoning], []);

    expect(draft.item_type).toBe("調味料");
  });

  it("auto-selects stock by normalized match (egg notation variants)", () => {
    // 在庫「卵」× レシピ「たまご」: 辞書一致（score=2）で自動選択される。
    const eggStock: StockItem = { ...baseStockItem, id: "stock-egg", name: "卵", unit: "個", category: "食材", quantity: 3 };
    const eggIngredient: RecipeIngredient = { ...baseIngredient, id: "ingredient-egg", name: "たまご", unit: "個", item_type: "食材", amount: 2 };

    const [draft] = buildDraftsFromRecipeIngredients([eggIngredient], [eggStock]);

    expect(draft.stockItemId).toBe("stock-egg");
    expect(draft.stockItemName).toBe("卵");
    expect(draft.amount).toBe("2");
    expect(draft.selected).toBe(true);
  });

  it("does not auto-select stock for partial match only (豚肉 vs 豚こま切れ肉)", () => {
    // 部分一致のみ（score=1）は自動選択しない。
    const porkStock: StockItem = { ...baseStockItem, id: "stock-pork", name: "豚こま切れ肉", unit: "g", category: "食材", quantity: 200 };
    const porkIngredient: RecipeIngredient = { ...baseIngredient, id: "ingredient-pork", name: "豚肉", unit: "g", item_type: "食材", amount: 150 };

    const [draft] = buildDraftsFromRecipeIngredients([porkIngredient], [porkStock]);

    expect(draft.stockItemId).toBe("");
    expect(draft.selected).toBe(false);
  });

  it("prefers higher-score match when multiple candidates are available", () => {
    // 完全一致（score=4）は正規化一致（score=3）より優先される。
    const exactStock: StockItem = { ...baseStockItem, id: "stock-exact", name: "卵", unit: "個", category: "食材", quantity: 5 };
    const normalizedStock: StockItem = { ...baseStockItem, id: "stock-normalized", name: "タマゴ", unit: "個", category: "食材", quantity: 3 };
    const eggIngredient: RecipeIngredient = { ...baseIngredient, id: "ingredient-egg2", name: "卵", unit: "個", item_type: "食材", amount: 2 };

    const [draft] = buildDraftsFromRecipeIngredients([eggIngredient], [normalizedStock, exactStock]);

    // 完全一致の stock-exact が選ばれる（score=4 > 3）。
    expect(draft.stockItemId).toBe("stock-exact");
  });
});
