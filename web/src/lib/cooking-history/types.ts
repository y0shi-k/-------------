import type { RecipeIngredientType } from "@/lib/recipes/types";

export type CookingHistoryPhoto = {
  id: string;
  user_id: string;
  bucket_id: string;
  /** 非公開バケット内のパス。表示時は useCachedSignedUrls(supabase, [storage_path]) で署名URLを解決する。 */
  storage_path: string;
  usage_type: string;
  cooking_history_id: string | null;
  content_type: string | null;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  /**
   * @deprecated サーバ側でのURL発行は廃止（TKT-0205）。
   * クライアントの useCachedSignedUrls で解決するため、このフィールドはサーバから渡されなくなった。
   * 「写真あり」判定は storage_path の有無で行うこと。
   */
  signed_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type CookingHistoryItem = {
  id: string;
  user_id: string;
  cooked_at: string;
  recipe_id: string | null;
  recipe_name: string;
  meal_schedule_id: string | null;
  note: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  photos: CookingHistoryPhoto[];
};

export type CookingConsumptionEvent = {
  id: string;
  user_id: string;
  cooking_history_id: string | null;
  meal_schedule_id: string | null;
  recipe_id: string | null;
  ingredient_name: string;
  requested_amount: number;
  requested_unit: string;
  consumed_amount: number;
  consumed_unit: string;
  stock_item_id: string | null;
  stock_item_name: string;
  substitute_for: string;
  created_at: string;
};

export type ConsumptionEditDraft = {
  id: string;
  isNew: boolean;
  item_type: RecipeIngredientType;
  ingredientName: string;
  requestedAmount: number;
  requestedUnit: string;
  originalConsumedAmount: number;
  consumedUnit: string;
  originalStockItemId: string;
  stockItemId: string;
  stockItemName: string;
  substituteFor: string;
  amount: string;
  selected: boolean;
};

export type CookingHistoryFormValues = {
  cooked_at: string;
  recipe_name: string;
  note: string;
  rating: string;
};

export function toDatetimeLocalValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export const emptyCookingHistoryFormValues: CookingHistoryFormValues = {
  cooked_at: toDatetimeLocalValue(),
  recipe_name: "",
  note: "",
  rating: ""
};
