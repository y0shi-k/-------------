export type ItemCategory = "食材" | "調味料";

export type UnitConversion = {
  fromQty: number;
  fromUnit: string;
  toQty: number;
  toUnit: string;
};

export type StockItem = {
  id: string;
  user_id: string;
  category: ItemCategory;
  name: string;
  quantity: number;
  unit: string;
  unit_conversion: UnitConversion | null;
  display_expires_on: string | null;
  effective_expires_on: string | null;
  storage_location: string;
  status_note: string;
  source: string;
  image_storage_path: string | null;
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
  conversion_from_qty: string;
  conversion_from_unit: string;
  conversion_to_qty: string;
  conversion_to_unit: string;
  display_expires_on: string;
  effective_expires_on: string;
  purchase_date: string;
  storage_location: string;
  status_note: string;
};

export const emptyStockItemFormValues: StockItemFormValues = {
  category: "食材",
  name: "",
  quantity: "1",
  unit: "個",
  conversion_from_qty: "",
  conversion_from_unit: "",
  conversion_to_qty: "",
  conversion_to_unit: "",
  display_expires_on: "",
  effective_expires_on: "",
  purchase_date: "",
  storage_location: "冷蔵庫",
  status_note: ""
};

function formatConversionRatio(conversion: UnitConversion | null) {
  if (!conversion || conversion.fromQty <= 0) return "";
  const ratio = conversion.toQty / conversion.fromQty;
  if (!Number.isFinite(ratio)) return "";
  return Number.isInteger(ratio) ? String(ratio) : String(Number(ratio.toFixed(3)));
}

export function toFormValues(item: StockItem): StockItemFormValues {
  return {
    category: item.category,
    name: item.name,
    quantity: String(item.quantity),
    unit: item.unit,
    conversion_from_qty: "",
    conversion_from_unit: "",
    conversion_to_qty: formatConversionRatio(item.unit_conversion),
    conversion_to_unit: item.unit_conversion?.toUnit ?? "",
    display_expires_on: item.display_expires_on ?? "",
    effective_expires_on: item.effective_expires_on ?? "",
    purchase_date: item.created_at ? item.created_at.slice(0, 10) : "",
    storage_location: item.storage_location,
    status_note: item.status_note
  };
}
