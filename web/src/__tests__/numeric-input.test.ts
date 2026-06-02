import { describe, expect, it } from "vitest";

import { sanitizeDecimalInput, stepDecimalString, toHalfWidthNumeric } from "@/lib/format/numeric";

describe("toHalfWidthNumeric", () => {
  it("全角数字を半角へ変換する", () => {
    expect(toHalfWidthNumeric("１２３")).toBe("123");
  });

  it("全角ピリオド・句点を半角ドットへ変換する", () => {
    expect(toHalfWidthNumeric("１．５")).toBe("1.5");
    expect(toHalfWidthNumeric("１。５")).toBe("1.5");
  });

  it("半角はそのまま保持する", () => {
    expect(toHalfWidthNumeric("12.5")).toBe("12.5");
  });
});

describe("sanitizeDecimalInput", () => {
  it("全角入力を半角の数値文字列へ正規化する", () => {
    expect(sanitizeDecimalInput("１０００")).toBe("1000");
  });

  it("数字と小数点以外を除去する", () => {
    expect(sanitizeDecimalInput("1a2b")).toBe("12");
    expect(sanitizeDecimalInput("-3")).toBe("3");
  });

  it("小数点は最初の1つだけ残す", () => {
    expect(sanitizeDecimalInput("1.2.3")).toBe("1.23");
  });

  it("入力途中の末尾ドットを許容する", () => {
    expect(sanitizeDecimalInput("1.")).toBe("1.");
  });
});

describe("stepDecimalString", () => {
  it("1刻みで増減する", () => {
    expect(stepDecimalString("1", 1, 1, 0)).toBe("2");
    expect(stepDecimalString("3", 1, -1, 0)).toBe("2");
  });

  it("小数を保持したまま整数分だけ増減する", () => {
    expect(stepDecimalString("1.5", 1, 1, 0)).toBe("2.5");
  });

  it("空文字からは0基準で増える", () => {
    expect(stepDecimalString("", 1, 1, 0)).toBe("1");
  });

  it("minを下回らない", () => {
    expect(stepDecimalString("0", 1, -1, 0)).toBe("0");
  });
});
