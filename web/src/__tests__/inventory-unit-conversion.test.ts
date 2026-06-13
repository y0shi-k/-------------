import { describe, expect, it } from "vitest";
import {
  conversionFactorToUnit,
  convertToStockUnit,
  stockAmountInUnit
} from "@/lib/inventory/unit-conversion";
import type { StockItem, UnitConversion } from "@/lib/inventory/types";

const porkConversion: UnitConversion = { fromQty: 1, fromUnit: "パック", toQty: 80, toUnit: "g" };

function porkStock(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: "stock-pork",
    user_id: "user-1",
    category: "食材",
    name: "豚コマ",
    quantity: 5,
    unit: "パック",
    unit_conversion: porkConversion,
    display_expires_on: null,
    effective_expires_on: null,
    storage_location: "冷凍庫",
    status_note: "",
    source: "manual",
    image_storage_path: null,
    created_at: "2026-06-12T00:00:00.000Z",
    updated_at: "2026-06-12T00:00:00.000Z",
    ...overrides
  };
}

describe("conversionFactorToUnit", () => {
  it("returns 1 when stock unit equals target unit", () => {
    expect(conversionFactorToUnit({ unit: "個", unit_conversion: null }, "個")).toBe(1);
  });

  it("returns toQty/fromQty for a forward conversion (1パック=80g)", () => {
    expect(conversionFactorToUnit(porkStock(), "g")).toBe(80);
  });

  it("trims units before comparing", () => {
    expect(conversionFactorToUnit({ unit: " パック ", unit_conversion: porkConversion }, " g ")).toBe(80);
  });

  it("returns null when no conversion is registered for a different unit", () => {
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: null }, "g")).toBeNull();
  });

  it("returns inverse factor for reverse direction when stock unit matches conversion toUnit", () => {
    // 在庫=g・換算 1パック=80g（toUnit=g = 在庫単位）・targetUnit=パック
    // 逆方向として fromQty/toQty = 1/80 = 0.0125 を返す
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: porkConversion }, "パック")).toBe(1 / 80);
  });

  it("guards against zero / negative / NaN fromQty or toQty", () => {
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, fromQty: 0 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, toQty: 0 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, toQty: -80 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, fromQty: Number.NaN } }, "g")).toBeNull();
  });

  it("returns inverse factor for reverse direction (stock unit=g, {1パック=80g}, target=パック)", () => {
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: porkConversion }, "パック")).toBe(1 / 80);
  });

  it("guards reverse direction against zero / negative / NaN", () => {
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: { ...porkConversion, fromQty: 0 } }, "パック")).toBeNull();
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: { ...porkConversion, toQty: 0 } }, "パック")).toBeNull();
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: { ...porkConversion, fromQty: -1 } }, "パック")).toBeNull();
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: { ...porkConversion, toQty: Number.NaN } }, "パック")).toBeNull();
  });

  it("prioritizes forward direction when both directions could match", () => {
    // (該当ケースは実際には作られないが、正方向を優先する設計を保証)
    // 例: fromUnit = toUnit = 同じユニット の場合は正方向が先に合致して停止
    const ambiguous: UnitConversion = { fromQty: 1, fromUnit: "個", toQty: 1, toUnit: "個" };
    expect(conversionFactorToUnit({ unit: "個", unit_conversion: ambiguous }, "個")).toBe(1);
  });
});

describe("stockAmountInUnit", () => {
  it("multiplies quantity by the factor (5パック×80g=400g)", () => {
    expect(stockAmountInUnit(porkStock(), "g")).toBe(400);
  });

  it("returns quantity unchanged for same unit", () => {
    expect(stockAmountInUnit(porkStock({ unit: "個", unit_conversion: null }), "個")).toBe(5);
  });

  it("returns null when not convertible", () => {
    expect(stockAmountInUnit(porkStock({ unit_conversion: null }), "g")).toBeNull();
  });

  it("converts reverse direction: 600g (stock unit) with {1パック=80g} to パック → 7.5パック", () => {
    // 在庫 600g、換算 1パック=80g、targetUnit=パック → 600 * (1/80) = 7.5
    expect(stockAmountInUnit({ unit: "g", quantity: 600, unit_conversion: porkConversion }, "パック")).toBe(7.5);
  });

  it("converts reverse direction: 400g with {1パック=80g} to パック → 5パック", () => {
    expect(stockAmountInUnit({ unit: "g", quantity: 400, unit_conversion: porkConversion }, "パック")).toBe(5);
  });
});

describe("convertToStockUnit", () => {
  it("passes through when input unit equals stock unit", () => {
    expect(convertToStockUnit(2, porkStock(), "パック")).toBe(2);
  });

  it("converts recipe-unit input to stock unit (300g → 3.75パック)", () => {
    expect(convertToStockUnit(300, porkStock(), "g")).toBe(3.75);
  });

  it("converts 120g → 1.5パック", () => {
    expect(convertToStockUnit(120, porkStock(), "g")).toBe(1.5);
  });

  it("returns null for negative / NaN amount", () => {
    expect(convertToStockUnit(-1, porkStock(), "g")).toBeNull();
    expect(convertToStockUnit(Number.NaN, porkStock(), "g")).toBeNull();
  });

  it("returns null when the input unit is not convertible", () => {
    expect(convertToStockUnit(300, porkStock({ unit_conversion: null }), "g")).toBeNull();
  });

  it("converts reverse direction: 2パック to stock unit g with {1パック=80g} → 160g", () => {
    // 在庫単位=g、inputUnit=パック、amount=2、換算 1パック=80g
    // factor(g→パック) = 1/80、amount/factor = 2 / (1/80) = 160g
    expect(convertToStockUnit(2, { unit: "g", unit_conversion: porkConversion }, "パック")).toBe(160);
  });

  it("converts reverse direction: 3パック to g → 240g", () => {
    expect(convertToStockUnit(3, { unit: "g", unit_conversion: porkConversion }, "パック")).toBe(240);
  });

  it("round-trips correctly within same stock setup", () => {
    // stock unit = g, conversion = 1パック=80g
    // 「入力2.5パック」を「在庫単位g」に → 200g
    const stock = { unit: "g", unit_conversion: porkConversion };
    const converted1 = convertToStockUnit(2.5, stock, "パック");
    expect(converted1).toBe(200);
    // 「入力200g」を「在庫単位g」に → 200g（パススルー）
    const converted2 = convertToStockUnit(200, stock, "g");
    expect(converted2).toBe(200);
    // つまり: 2.5パック == 200g ✓
  });
});
