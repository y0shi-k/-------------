import { describe, expect, it } from "vitest";
import { computeRollbackQuantityUpdates } from "@/lib/cooking-history/rollback";
import type { StockItem } from "@/lib/inventory/types";

const baseStockItem: StockItem = {
  id: "stock-a",
  user_id: "user-1",
  category: "食材",
  name: "玉ねぎ",
  quantity: 3,
  unit: "個",
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

describe("cooking history rollback helpers", () => {
  it("adds consumed amounts back to matching inventory", () => {
    const updates = computeRollbackQuantityUpdates([{ stock_item_id: "stock-a", consumed_amount: 2 }], [baseStockItem]);

    expect(updates).toEqual([{ id: "stock-a", missing: false, previousQuantity: 3, nextQuantity: 5 }]);
  });

  it("groups multiple events for the same stock item", () => {
    const updates = computeRollbackQuantityUpdates(
      [
        { stock_item_id: "stock-a", consumed_amount: 1 },
        { stock_item_id: "stock-a", consumed_amount: 2 }
      ],
      [baseStockItem]
    );

    expect(updates).toEqual([{ id: "stock-a", missing: false, previousQuantity: 3, nextQuantity: 6 }]);
  });

  it("skips events with no stock item or invalid amount", () => {
    const updates = computeRollbackQuantityUpdates(
      [
        { stock_item_id: null, consumed_amount: 2 },
        { stock_item_id: "", consumed_amount: 2 },
        { stock_item_id: "stock-a", consumed_amount: -1 },
        { stock_item_id: "stock-a", consumed_amount: Number.NaN }
      ],
      [baseStockItem]
    );

    expect(updates).toEqual([]);
  });

  it("marks deleted inventory as missing without throwing", () => {
    const updates = computeRollbackQuantityUpdates([{ stock_item_id: "deleted-stock", consumed_amount: 2 }], [baseStockItem]);

    expect(updates).toEqual([{ id: "deleted-stock", missing: true, previousQuantity: 0, nextQuantity: 0 }]);
  });
});
