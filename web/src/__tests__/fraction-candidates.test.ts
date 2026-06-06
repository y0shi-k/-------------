import { afterEach, describe, expect, it } from "vitest";

import { addCustomFraction, DEFAULT_FRACTIONS, getCustomFractions } from "@/lib/format/fraction-candidates";

afterEach(() => {
  window.localStorage.clear();
});

describe("fraction-candidates（端末内の分数候補メモリ）", () => {
  it("初期はユーザー追加候補なし", () => {
    expect(getCustomFractions()).toEqual([]);
  });

  it("新しい分数を追加して記憶できる", () => {
    addCustomFraction("3/8");
    addCustomFraction("5/8");
    expect(getCustomFractions()).toEqual(["3/8", "5/8"]);
  });

  it("既定の分数は追加しない", () => {
    DEFAULT_FRACTIONS.forEach((fraction) => addCustomFraction(fraction));
    expect(getCustomFractions()).toEqual([]);
  });

  it("重複は追加しない", () => {
    addCustomFraction("3/8");
    addCustomFraction("3/8");
    expect(getCustomFractions()).toEqual(["3/8"]);
  });
});
