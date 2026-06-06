import type { StockItem } from "@/lib/inventory/types";

export type RollbackConsumptionEvent = {
  consumed_amount: number | null;
  stock_item_id: string | null;
};

export type RollbackQuantityUpdate = {
  id: string;
  missing: boolean;
  nextQuantity: number;
  previousQuantity: number;
};

export function computeRollbackQuantityUpdates(events: RollbackConsumptionEvent[], inventoryItems: StockItem[]): RollbackQuantityUpdate[] {
  const amountsByStockId = new Map<string, number>();

  for (const event of events) {
    const stockItemId = event.stock_item_id ?? "";
    const consumedAmount = normalizeAmount(Number(event.consumed_amount ?? 0));
    if (!stockItemId || consumedAmount === 0) continue;
    amountsByStockId.set(stockItemId, (amountsByStockId.get(stockItemId) ?? 0) + consumedAmount);
  }

  return Array.from(amountsByStockId, ([stockItemId, consumedAmount]) => {
    const item = inventoryItems.find((entry) => entry.id === stockItemId);
    const previousQuantity = Number(item?.quantity ?? 0);

    return {
      id: stockItemId,
      missing: !item,
      previousQuantity,
      nextQuantity: item ? previousQuantity + consumedAmount : previousQuantity
    };
  });
}

function normalizeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
