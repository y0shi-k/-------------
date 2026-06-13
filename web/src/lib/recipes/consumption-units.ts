/**
 * 消費ダイアログの「入力単位（consumeUnit）」決定と在庫単位への換算判定（純粋関数）。
 *
 * 背景（TKT-0249）:
 * レシピ「じゃがいも 100g」に対し在庫「じゃがいも 3個」（換算未登録）のような単位不一致在庫を
 * 選んだとき、レシピ単位の数値がそのまま個数として誤って減算される問題を防ぐ。
 * 換算可否の判定は `conversionFactorToUnit`（null=換算不能）を唯一の基準とする。
 */

import {
  conversionFactorToUnit,
  convertToStockUnit,
  type ConvertibleStock
} from "@/lib/inventory/unit-conversion";

/**
 * 在庫を選び直したときの入力単位（consumeUnit）を決める。
 *
 * - stockItem が null（未選択） → consumeUnit = requestedUnit（従来挙動）
 * - 換算可（同単位含む = conversionFactorToUnit !== null） → consumeUnit = requestedUnit（従来挙動）
 * - 換算不可（conversionFactorToUnit === null）かつ単位不一致 →
 *     consumeUnit = 在庫単位、resetAmount = true
 *       （レシピ単位の必要量を在庫単位の数量として誤流用しないため入力値をリセットする）
 */
export function resolveConsumeUnitForStock(
  stockItem: ConvertibleStock | null,
  requestedUnit: string
): { consumeUnit: string; resetAmount: boolean } {
  if (!stockItem) {
    return { consumeUnit: requestedUnit, resetAmount: false };
  }
  const factor = conversionFactorToUnit(stockItem, requestedUnit);
  if (factor === null && stockItem.unit !== requestedUnit) {
    // 換算不能な単位不一致在庫: 在庫単位で入力させ、誤った初期値を残さない。
    return { consumeUnit: stockItem.unit, resetAmount: true };
  }
  return { consumeUnit: requestedUnit, resetAmount: false };
}

export type ConsumedStockAmountResult =
  | { ok: true; consumedStockAmount: number; converted: boolean }
  | { ok: false; reason: "unit-switch-needed" };

/**
 * 入力された消費量（consumeUnit 単位）を在庫単位の減算量へ換算する。
 *
 * - 換算成功 → ok: true（consumedStockAmount は在庫単位、converted は consumeUnit ≠ 在庫単位か）
 * - 換算失敗 → ok: false reason="unit-switch-needed"
 *     （換算不可在庫を選んだまま consumeUnit がレシピ単位＝在庫単位と不一致で確定したケース。
 *      呼び出し側は単位切替を促すエラーを出す）
 *
 * consumeUnit が在庫単位なら convertToStockUnit は同単位素通しで成功するため、
 * 換算不可在庫でも在庫単位入力なら正しく減算できる。
 */
export function resolveConsumedStockAmount(
  consumedAmount: number,
  stockItem: ConvertibleStock,
  consumeUnit: string
): ConsumedStockAmountResult {
  const consumedStockAmount = convertToStockUnit(consumedAmount, stockItem, consumeUnit);
  if (consumedStockAmount === null) {
    return { ok: false, reason: "unit-switch-needed" };
  }
  return {
    ok: true,
    consumedStockAmount,
    converted: consumeUnit !== stockItem.unit
  };
}
