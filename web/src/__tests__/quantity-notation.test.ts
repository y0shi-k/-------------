import { afterEach, describe, expect, it } from "vitest";

import { clearQuantityNotation, getQuantityNotation, setQuantityNotation } from "@/lib/format/quantity-notation";

afterEach(() => {
  window.localStorage.clear();
});

describe("quantity-notation（端末内の表示形式メモリ）", () => {
  it("保存した形式を読み出せる", () => {
    setQuantityNotation("item-1", "fraction");
    setQuantityNotation("item-2", "decimal");
    expect(getQuantityNotation("item-1")).toBe("fraction");
    expect(getQuantityNotation("item-2")).toBe("decimal");
  });

  it("未保存のアイテムは undefined を返す", () => {
    expect(getQuantityNotation("unknown")).toBeUndefined();
  });

  it("空の itemId は保存も取得もしない", () => {
    setQuantityNotation("", "fraction");
    expect(getQuantityNotation("")).toBeUndefined();
  });

  it("上書き保存できる", () => {
    setQuantityNotation("item-1", "fraction");
    setQuantityNotation("item-1", "decimal");
    expect(getQuantityNotation("item-1")).toBe("decimal");
  });

  it("削除すると undefined に戻る", () => {
    setQuantityNotation("item-1", "fraction");
    clearQuantityNotation("item-1");
    expect(getQuantityNotation("item-1")).toBeUndefined();
  });
});
