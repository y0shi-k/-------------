import { describe, expect, it } from "vitest";
import {
  resolveConsumeUnitForStock,
  resolveConsumedStockAmount
} from "@/lib/recipes/consumption-units";
import type { ConvertibleStock } from "@/lib/inventory/unit-conversion";
import type { UnitConversion } from "@/lib/inventory/types";

// 換算未登録・在庫単位「個」（レシピ単位 g とは換算不能）
const potato: ConvertibleStock = { unit: "個", unit_conversion: null };
// 換算登録あり・在庫単位「パック」（1パック=80g → g へ換算可能）
const porkConversion: UnitConversion = { fromQty: 1, fromUnit: "パック", toQty: 80, toUnit: "g" };
const pork: ConvertibleStock = { unit: "パック", unit_conversion: porkConversion };
// 同単位在庫（在庫単位 g・レシピ単位 g）
const sameUnitStock: ConvertibleStock = { unit: "g", unit_conversion: null };

describe("resolveConsumeUnitForStock", () => {
  it("換算不可在庫（じゃがいも個 vs レシピg）を選ぶと在庫単位へ切替＆入力リセット", () => {
    expect(resolveConsumeUnitForStock(potato, "g")).toEqual({ consumeUnit: "個", resetAmount: true });
  });

  it("換算可在庫（パック→g）を選んでもレシピ単位を維持する（既存挙動）", () => {
    expect(resolveConsumeUnitForStock(pork, "g")).toEqual({ consumeUnit: "g", resetAmount: false });
  });

  it("同単位在庫はレシピ単位を維持し入力をリセットしない", () => {
    expect(resolveConsumeUnitForStock(sameUnitStock, "g")).toEqual({ consumeUnit: "g", resetAmount: false });
  });

  it("在庫未選択(null)はレシピ単位を維持する", () => {
    expect(resolveConsumeUnitForStock(null, "g")).toEqual({ consumeUnit: "g", resetAmount: false });
  });

  it("換算不可でも在庫単位とレシピ単位が同名なら切替しない", () => {
    const stock: ConvertibleStock = { unit: "g", unit_conversion: null };
    expect(resolveConsumeUnitForStock(stock, "g")).toEqual({ consumeUnit: "g", resetAmount: false });
  });
});

describe("resolveConsumedStockAmount", () => {
  it("換算不可在庫＋在庫単位入力「1」→ 在庫単位1・converted=false", () => {
    const result = resolveConsumedStockAmount(1, potato, "個");
    expect(result).toEqual({ ok: true, consumedStockAmount: 1, converted: false });
  });

  it("換算不可在庫＋レシピ単位のまま → ok:false（unit-switch-needed）でブロック", () => {
    const result = resolveConsumedStockAmount(100, potato, "g");
    expect(result).toEqual({ ok: false, reason: "unit-switch-needed" });
  });

  it("換算可在庫（パック）＋レシピ単位g「160」→ 在庫単位2パック・converted=true", () => {
    const result = resolveConsumedStockAmount(160, pork, "g");
    expect(result).toEqual({ ok: true, consumedStockAmount: 2, converted: true });
  });

  it("換算可在庫＋在庫単位入力「3」→ 在庫単位3・converted=false（同単位素通し）", () => {
    const result = resolveConsumedStockAmount(3, pork, "パック");
    expect(result).toEqual({ ok: true, consumedStockAmount: 3, converted: false });
  });

  it("同単位在庫＋同単位入力 → 在庫単位そのまま・converted=false（既存挙動）", () => {
    const result = resolveConsumedStockAmount(50, sameUnitStock, "g");
    expect(result).toEqual({ ok: true, consumedStockAmount: 50, converted: false });
  });
});
