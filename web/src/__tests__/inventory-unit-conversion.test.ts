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

  it("returns null for reverse direction (target is the stock unit's source, not toUnit)", () => {
    // 在庫=g・換算 1パック=80g（fromUnit=パック ≠ 在庫単位 g）はマッチしない（逆方向はスコープ外）
    expect(conversionFactorToUnit({ unit: "g", unit_conversion: porkConversion }, "パック")).toBeNull();
  });

  it("guards against zero / negative / NaN fromQty or toQty", () => {
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, fromQty: 0 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, toQty: 0 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, toQty: -80 } }, "g")).toBeNull();
    expect(conversionFactorToUnit({ unit: "パック", unit_conversion: { ...porkConversion, fromQty: Number.NaN } }, "g")).toBeNull();
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
});
