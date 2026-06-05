import { describe, expect, it } from "vitest";
import { resolveIngredientImage } from "@/lib/ui/ingredient-image";

describe("resolveIngredientImage", () => {
  it("assigns standard images to the initial catalog ingredients", () => {
    const names = [
      "鶏肉",
      "豚肉",
      "牛肉",
      "ひき肉",
      "鮭",
      "玉ねぎ",
      "にんじん",
      "じゃがいも",
      "キャベツ",
      "トマト",
      "きのこ",
      "小松菜",
      "大根",
      "長ねぎ",
      "卵",
      "牛乳",
      "チーズ",
      "米",
      "パン",
      "パスタ",
      "うどん",
      "納豆",
      "伊右衛門",
      "醤油",
      "味噌",
      "塩",
      "砂糖",
      "酢",
      "みりん",
      "酒",
      "油",
      "カレールー"
    ];

    expect(names.map((name) => [name, resolveIngredientImage(name)?.key])).toEqual(
      names.map((name) => [name, expect.any(String)])
    );
  });

  it("normalizes spelling variants", () => {
    expect(resolveIngredientImage("玉葱")?.key).toBe("onion");
    expect(resolveIngredientImage("サーモン")?.key).toBe("fish");
    expect(resolveIngredientImage("スパゲティ")?.key).toBe("noodle");
    expect(resolveIngredientImage("緑茶")?.key).toBe("tea");
  });

  it("prefers longer specific food names over short generic keywords", () => {
    expect(resolveIngredientImage("牛乳")?.key).toBe("dairy");
    expect(resolveIngredientImage("牛肉")?.key).toBe("beef");
  });

  it("prioritizes seasoning images for seasoning category names", () => {
    expect(resolveIngredientImage("米油", "調味料")?.key).toBe("oil");
    expect(resolveIngredientImage("自家製たれ", "調味料")?.key).toBe("seasoning");
  });

  it("returns null for unknown non-seasoning ingredients so emoji fallback can render", () => {
    expect(resolveIngredientImage("謎の食材")).toBeNull();
  });
});
