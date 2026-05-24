export type ItemCategory = "食材" | "調味料";

export type StockItem = {
  id: string;
  user_id: string;
  category: ItemCategory;
  name: string;
  quantity: number;
  unit: string;
  display_expires_on: string | null;
  effective_expires_on: string | null;
  storage_location: string;
  status_note: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type StorageLocation = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StockItemFormValues = {
  category: ItemCategory;
  name: string;
  quantity: string;
  unit: string;
  display_expires_on: string;
  effective_expires_on: string;
  storage_location: string;
  status_note: string;
};

export const emptyStockItemFormValues: StockItemFormValues = {
  category: "食材",
  name: "",
  quantity: "1",
  unit: "個",
  display_expires_on: "",
  effective_expires_on: "",
  storage_location: "冷蔵庫",
  status_note: ""
};

export function toFormValues(item: StockItem): StockItemFormValues {
  return {
    category: item.category,
    name: item.name,
    quantity: String(item.quantity),
    unit: item.unit,
    display_expires_on: item.display_expires_on ?? "",
    effective_expires_on: item.effective_expires_on ?? "",
    storage_location: item.storage_location,
    status_note: item.status_note
  };
}
