import type { ConsumptionEditDraft, CookingConsumptionEvent } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";

export type InventoryAdjustment = {
  deltaQuantity: number;
  stockItemId: string;
};

export type QuantityUpdate = {
  id: string;
  missing: boolean;
  nextQuantity: number;
  previousQuantity: number;
};

export function buildEditDrafts(events: CookingConsumptionEvent[]): ConsumptionEditDraft[] {
  return events.map((event) => {
    const consumedAmount = Number(event.consumed_amount || 0);
    const stockItemId = event.stock_item_id ?? "";

    return {
      id: event.id,
      ingredientName: event.ingredient_name,
      requestedAmount: Number(event.requested_amount || 0),
      requestedUnit: event.requested_unit,
      originalConsumedAmount: Number.isFinite(consumedAmount) ? consumedAmount : 0,
      consumedUnit: event.consumed_unit,
      originalStockItemId: stockItemId,
      stockItemId,
      stockItemName: event.stock_item_name,
      substituteFor: event.substitute_for,
      amount: String(Number.isFinite(consumedAmount) ? consumedAmount : 0),
      selected: true
    };
  });
}

export function computeInventoryAdjustments(drafts: ConsumptionEditDraft[]): InventoryAdjustment[] {
  const adjustments = new Map<string, number>();
  const addAdjustment = (stockItemId: string, deltaQuantity: number) => {
    if (!stockItemId || deltaQuantity === 0) return;
    adjustments.set(stockItemId, (adjustments.get(stockItemId) ?? 0) + deltaQuantity);
  };

  for (const draft of drafts) {
    const originalAmount = normalizeAmount(draft.originalConsumedAmount);
    const nextAmount = draft.selected ? normalizeAmount(Number(draft.amount)) : 0;
    const originalStockItemId = draft.originalStockItemId;
    const nextStockItemId = draft.selected ? draft.stockItemId : "";

    if (!draft.selected || !nextStockItemId) {
      addAdjustment(originalStockItemId, originalAmount);
      continue;
    }

    if (originalStockItemId === nextStockItemId) {
      addAdjustment(nextStockItemId, -(nextAmount - originalAmount));
      continue;
    }

    addAdjustment(originalStockItemId, originalAmount);
    addAdjustment(nextStockItemId, -nextAmount);
  }

  return Array.from(adjustments, ([stockItemId, deltaQuantity]) => ({ stockItemId, deltaQuantity }));
}

export function applyAdjustmentsToQuantities(items: StockItem[], adjustments: InventoryAdjustment[]): QuantityUpdate[] {
  return adjustments.map((adjustment) => {
    const item = items.find((entry) => entry.id === adjustment.stockItemId);
    const previousQuantity = Number(item?.quantity ?? 0);
    const nextQuantity = item ? Math.max(0, previousQuantity + adjustment.deltaQuantity) : previousQuantity;

    return {
      id: adjustment.stockItemId,
      missing: !item,
      nextQuantity,
      previousQuantity
    };
  });
}

function normalizeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
