/**
 * 在庫単位とレシピ単位の換算ヘルパー（純粋関数）。
 *
 * 在庫アイテムは unit_conversion に「1 fromUnit = toQty toUnit」（fromUnit=在庫単位）を持つことがある。
 * 例: 豚コマ 在庫単位「パック」・unit_conversion {fromQty:1, fromUnit:"パック", toQty:80, toUnit:"g"}。
 *
 * 対応するのは以下の2方向:
 * 1. 正方向: 「在庫単位 → toUnit（レシピ単位）」（例: パック → g）
 * 2. 逆方向: 「toUnit → fromUnit（在庫単位）」（例: g → パック）
 * 連鎖換算はスコープ外（null を返す）。
 */

import { roundQuantity } from "@/lib/format/numeric";
import type { StockItem, UnitConversion } from "@/lib/inventory/types";

// 換算判定に必要な最小フィールドだけを要求する（StockItem 全体には依存しない）。
export type ConvertibleStock = Pick<StockItem, "unit" | "unit_conversion">;

// 単位文字列は前後空白を無視して比較する（normalizeUnitConversion と同じ流儀）。
function sameUnit(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

// unit_conversion が正方向換算（在庫単位 → toUnit）として有効かを返す。
function validForwardConversion(item: ConvertibleStock, conversion: UnitConversion | null): conversion is UnitConversion {
  if (!conversion) return false;
  return (
    sameUnit(conversion.fromUnit, item.unit) &&
    Number.isFinite(conversion.fromQty) &&
    Number.isFinite(conversion.toQty) &&
    conversion.fromQty > 0 &&
    conversion.toQty > 0
  );
}

// unit_conversion が逆方向換算（toUnit → 在庫単位 fromUnit）として有効かを返す。
function validReverseConversion(item: ConvertibleStock, conversion: UnitConversion | null): conversion is UnitConversion {
  if (!conversion) return false;
  return (
    sameUnit(conversion.toUnit, item.unit) &&
    Number.isFinite(conversion.fromQty) &&
    Number.isFinite(conversion.toQty) &&
    conversion.fromQty > 0 &&
    conversion.toQty > 0
  );
}

/**
 * 在庫単位 1 あたりの targetUnit 換算量を返す。
 * - item.unit === targetUnit → 1（換算不要）
 * - unit_conversion が正方向有効で toUnit === targetUnit → toQty / fromQty（例 80）
 * - unit_conversion が逆方向有効で fromUnit === targetUnit → fromQty / toQty（例 1/200 = 0.005）
 * - それ以外 → null（換算不能）
 */
export function conversionFactorToUnit(item: ConvertibleStock, targetUnit: string): number | null {
  if (sameUnit(item.unit, targetUnit)) return 1;

  const conversion = item.unit_conversion;

  // 正方向を優先評価
  if (validForwardConversion(item, conversion) && sameUnit(conversion.toUnit, targetUnit)) {
    const factor = conversion.toQty / conversion.fromQty;
    return Number.isFinite(factor) && factor > 0 ? factor : null;
  }

  // 逆方向を試す
  if (validReverseConversion(item, conversion) && sameUnit(conversion.fromUnit, targetUnit)) {
    const factor = conversion.fromQty / conversion.toQty;
    return Number.isFinite(factor) && factor > 0 ? factor : null;
  }

  return null;
}

/**
 * 在庫の総量を targetUnit に換算して返す（quantity × factor）。換算不能なら null。
 */
export function stockAmountInUnit(item: Pick<StockItem, "unit" | "unit_conversion" | "quantity">, targetUnit: string): number | null {
  const factor = conversionFactorToUnit(item, targetUnit);
  if (factor === null) return null;
  const quantity = Number(item.quantity || 0);
  if (!Number.isFinite(quantity)) return null;
  return roundQuantity(quantity * factor);
}

/**
 * inputUnit で入力された消費量を在庫単位の量へ換算して返す。
 * - inputUnit が在庫単位 → 素通し（同単位）
 * - inputUnit が targetUnit（レシピ単位） → amount / factor（例 300g / 80 = 3.75 パック）
 * - 換算不能・不正値 → null
 */
export function convertToStockUnit(amount: number, item: ConvertibleStock, inputUnit: string): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (sameUnit(item.unit, inputUnit)) return roundQuantity(amount);

  const factor = conversionFactorToUnit(item, inputUnit);
  if (factor === null || factor <= 0) return null;
  return roundQuantity(amount / factor);
}
