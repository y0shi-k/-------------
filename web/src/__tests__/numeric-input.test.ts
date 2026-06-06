import { describe, expect, it } from "vitest";

import {
  detectNotation,
  displayQuantity,
  formatQuantity,
  formatQuantityDecimal,
  formatQuantityForInput,
  isFractionalUnit,
  parseQuantityInput,
  quantityToNumber,
  sanitizeDecimalInput,
  sanitizeQuantityInput,
  stepDecimalString,
  toHalfWidthNumeric
} from "@/lib/format/numeric";

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

  it("分数値からも増減できる", () => {
    expect(stepDecimalString("1/2", 1, 1, 0)).toBe("1.5");
  });

  it("空文字からは0基準で増える", () => {
    expect(stepDecimalString("", 1, 1, 0)).toBe("1");
  });

  it("minを下回らない", () => {
    expect(stepDecimalString("0", 1, -1, 0)).toBe("0");
  });
});

describe("sanitizeQuantityInput", () => {
  it("数字・小数点・スラッシュを残す", () => {
    expect(sanitizeQuantityInput("1/2")).toBe("1/2");
    expect(sanitizeQuantityInput("0.5")).toBe("0.5");
  });

  it("全角スラッシュ・全角数字を半角へ正規化する", () => {
    expect(sanitizeQuantityInput("１／２")).toBe("1/2");
  });

  it("スラッシュは最初の1つだけ残す", () => {
    expect(sanitizeQuantityInput("1/2/3")).toBe("1/23");
  });

  it("入力途中の末尾スラッシュを許容する", () => {
    expect(sanitizeQuantityInput("1/")).toBe("1/");
  });

  it("帯分数の区切り空白を1つだけ残す", () => {
    expect(sanitizeQuantityInput("2 1/2")).toBe("2 1/2");
    expect(sanitizeQuantityInput("2  1/2")).toBe("2 1/2");
    expect(sanitizeQuantityInput("　2 1/2")).toBe("2 1/2");
  });

  it("数字・記号以外を除去する", () => {
    expect(sanitizeQuantityInput("1a/2b")).toBe("1/2");
  });
});

describe("isFractionalUnit", () => {
  it("g/ml/cc は分数対象外", () => {
    expect(isFractionalUnit("g")).toBe(false);
    expect(isFractionalUnit("ml")).toBe(false);
    expect(isFractionalUnit("cc")).toBe(false);
  });

  it("個・本などは分数対象", () => {
    expect(isFractionalUnit("個")).toBe(true);
    expect(isFractionalUnit("本")).toBe(true);
  });
});

describe("parseQuantityInput", () => {
  it("整数・小数を数値へ変換する", () => {
    expect(parseQuantityInput("2")).toEqual({ ok: true, value: 2 });
    expect(parseQuantityInput("0.5")).toEqual({ ok: true, value: 0.5 });
  });

  it("分数を数値へ変換する", () => {
    expect(parseQuantityInput("1/2")).toEqual({ ok: true, value: 0.5 });
    expect(parseQuantityInput("2/3").ok).toBe(true);
    const oneThird = parseQuantityInput("1/3");
    expect(oneThird.ok && Math.abs(oneThird.value - 1 / 3) < 1e-6).toBe(true);
  });

  it("帯分数 2 1/2 を 2.5 に変換する", () => {
    expect(parseQuantityInput("2 1/2")).toEqual({ ok: true, value: 2.5 });
    expect(parseQuantityInput("１２ １／２")).toEqual({ ok: true, value: 12.5 });
  });

  it("帯分数の分母0はエラー", () => {
    expect(parseQuantityInput("2 1/0").ok).toBe(false);
  });

  it("空白だけ区切られた不正値はエラー", () => {
    expect(parseQuantityInput("2 5").ok).toBe(false);
  });

  it("全角の分数も受け付ける", () => {
    expect(parseQuantityInput("１／２")).toEqual({ ok: true, value: 0.5 });
  });

  it("分母0はエラーにする", () => {
    const result = parseQuantityInput("1/0");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("分母");
    }
  });

  it("数値以外・空はエラーにする", () => {
    expect(parseQuantityInput("abc").ok).toBe(false);
    expect(parseQuantityInput("").ok).toBe(false);
    expect(parseQuantityInput("1//2").ok).toBe(false);
  });
});

describe("quantityToNumber", () => {
  it("分数を数値で返す", () => {
    expect(quantityToNumber("1/2")).toBe(0.5);
  });

  it("不正値はNaNを返す", () => {
    expect(Number.isNaN(quantityToNumber("abc"))).toBe(true);
  });
});

describe("formatQuantity", () => {
  it("整数はそのまま表示する", () => {
    expect(formatQuantity(2)).toBe("2");
  });

  it("代表的な端数を分数で表示する", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
    expect(formatQuantity(2 / 3)).toBe("2/3");
    expect(formatQuantity(1 / 3)).toBe("1/3");
  });

  it("1以上の端数は混合分数で表示する", () => {
    expect(formatQuantity(1.5)).toBe("1 1/2");
  });

  it("分数に戻せない値は小数を短く表示する", () => {
    expect(formatQuantity(0.123)).toBe("0.12");
  });
});

describe("調理減算シナリオ（1個から1/3個 消費）", () => {
  it("残量が2/3個として表示される", () => {
    const consumed = quantityToNumber("1/3");
    const next = Math.max(0, 1 - consumed);
    expect(formatQuantity(next)).toBe("2/3");
  });

  it("在庫はマイナスにならない", () => {
    const consumed = quantityToNumber("2");
    const next = Math.max(0, 1 - consumed);
    expect(formatQuantity(next)).toBe("0");
  });
});

describe("formatQuantityDecimal", () => {
  it("分数に戻さず小数で表示する", () => {
    expect(formatQuantityDecimal(0.5)).toBe("0.5");
    expect(formatQuantityDecimal(2.5)).toBe("2.5");
    expect(formatQuantityDecimal(2)).toBe("2");
  });
});

describe("detectNotation", () => {
  it("スラッシュ有りは fraction", () => {
    expect(detectNotation("1/2")).toBe("fraction");
    expect(detectNotation("2 1/2")).toBe("fraction");
  });

  it("スラッシュ無しは decimal", () => {
    expect(detectNotation("0.5")).toBe("decimal");
    expect(detectNotation("2")).toBe("decimal");
  });
});

describe("displayQuantity", () => {
  it("decimal 指定では小数、fraction/未指定では分数", () => {
    expect(displayQuantity(0.5, "decimal")).toBe("0.5");
    expect(displayQuantity(0.5, "fraction")).toBe("1/2");
    expect(displayQuantity(2.5)).toBe("2 1/2");
  });
});

describe("formatQuantityForInput", () => {
  it("分数許可時は帯分数を含む分数で返す", () => {
    expect(formatQuantityForInput(1 / 3)).toBe("1/3");
    expect(formatQuantityForInput(2.5)).toBe("2 1/2");
  });

  it("notation=decimal なら小数で返す", () => {
    expect(formatQuantityForInput(2.5, { notation: "decimal" })).toBe("2.5");
  });

  it("allowFraction=false（g/cc）なら小数で返す", () => {
    expect(formatQuantityForInput(0.5, { allowFraction: false })).toBe("0.5");
  });

  it("整数はそのまま返す", () => {
    expect(formatQuantityForInput(2)).toBe("2");
  });
});
