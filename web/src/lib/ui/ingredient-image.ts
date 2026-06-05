import type { ItemCategory } from "@/lib/inventory/types";

export type StandardIngredientImage = {
  key: string;
  src: string;
  alt: string;
};

export type UserIngredientImage = {
  image_storage_path: string;
  normalized_name: string;
};

export type IngredientDisplayImage =
  | { kind: "inventory"; src: string; alt: string }
  | { kind: "user"; src: string; alt: string }
  | ({ kind: "standard" } & StandardIngredientImage)
  | { kind: "emoji"; emoji: string; alt: string };

type IngredientImageRule = StandardIngredientImage & {
  keywords: readonly string[];
};

const INGREDIENT_IMAGE_BASE_PATH = "/images/ingredients";

const IMAGE_RULES: readonly IngredientImageRule[] = [
  {
    key: "chicken",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-chicken.svg`,
    alt: "鶏肉の標準アイコン",
    keywords: ["鶏", "鳥", "チキン", "とり", "ささみ", "手羽"]
  },
  {
    key: "pork",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-pork.svg`,
    alt: "豚肉の標準アイコン",
    keywords: ["豚", "ポーク", "ベーコン", "ハム"]
  },
  {
    key: "beef",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-beef.svg`,
    alt: "牛肉の標準アイコン",
    keywords: ["牛", "ビーフ", "ステーキ", "ひき肉", "挽肉", "合いびき", "肉"]
  },
  {
    key: "fish",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-fish.svg`,
    alt: "魚の標準アイコン",
    keywords: ["鮭", "さけ", "サーモン", "魚", "さば", "鯖", "さんま", "あじ", "ぶり", "まぐろ", "たら", "ししゃも"]
  },
  {
    key: "tomato",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-tomato.svg`,
    alt: "トマトの標準アイコン",
    keywords: ["トマト", "ミニトマト"]
  },
  {
    key: "carrot",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-carrot.svg`,
    alt: "にんじんの標準アイコン",
    keywords: ["にんじん", "人参", "ニンジン"]
  },
  {
    key: "onion",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-onion.svg`,
    alt: "ねぎ類の標準アイコン",
    keywords: ["玉ねぎ", "たまねぎ", "玉葱", "オニオン", "長ねぎ", "長ネギ", "ねぎ", "ネギ"]
  },
  {
    key: "potato",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-potato.svg`,
    alt: "じゃがいもの標準アイコン",
    keywords: ["じゃがいも", "ジャガイモ", "芋", "ポテト"]
  },
  {
    key: "mushroom",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-mushroom.svg`,
    alt: "きのこの標準アイコン",
    keywords: ["きのこ", "しいたけ", "椎茸", "しめじ", "えのき", "まいたけ", "エリンギ"]
  },
  {
    key: "greens",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-greens.svg`,
    alt: "葉物野菜の標準アイコン",
    keywords: ["キャベツ", "レタス", "白菜", "ほうれん草", "小松菜", "青梗菜", "菜"]
  },
  {
    key: "radish",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-radish.svg`,
    alt: "大根の標準アイコン",
    keywords: ["大根", "だいこん", "ダイコン"]
  },
  {
    key: "egg",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-egg.svg`,
    alt: "卵の標準アイコン",
    keywords: ["卵", "玉子", "たまご"]
  },
  {
    key: "dairy",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-dairy.svg`,
    alt: "乳製品の標準アイコン",
    keywords: ["牛乳", "ミルク", "チーズ"]
  },
  {
    key: "rice",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-rice.svg`,
    alt: "米の標準アイコン",
    keywords: ["米", "白米", "玄米", "ごはん", "ご飯", "飯"]
  },
  {
    key: "bread",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-bread.svg`,
    alt: "パンの標準アイコン",
    keywords: ["パン", "食パン"]
  },
  {
    key: "noodle",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-noodle.svg`,
    alt: "麺類の標準アイコン",
    keywords: ["パスタ", "スパゲティ", "うどん", "麺", "マカロニ"]
  },
  {
    key: "natto",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-natto.svg`,
    alt: "納豆の標準アイコン",
    keywords: ["納豆"]
  },
  {
    key: "tea",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-tea.svg`,
    alt: "お茶の標準アイコン",
    keywords: ["伊右衛門", "お茶", "緑茶", "茶", "ティー"]
  },
  {
    key: "seasoning",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-seasoning.svg`,
    alt: "調味料の標準アイコン",
    keywords: ["醤油", "しょうゆ", "味噌", "みそ", "塩", "砂糖", "酢", "みりん", "酒", "料理酒", "だし", "出汁", "調味料"]
  },
  {
    key: "oil",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-oil.svg`,
    alt: "油の標準アイコン",
    keywords: ["油", "オイル"]
  },
  {
    key: "curry",
    src: `${INGREDIENT_IMAGE_BASE_PATH}/ingredient-curry.svg`,
    alt: "カレーの標準アイコン",
    keywords: ["カレールー", "カレー粉", "カレー"]
  }
];

export function resolveIngredientImage(name: string, category?: ItemCategory): StandardIngredientImage | null {
  const normalized = normalizeIngredientName(name);
  if (!normalized) return category === "調味料" ? imageForKey("seasoning") : null;

  const rules = category === "調味料" ? prioritizeSeasoningRules() : IMAGE_RULES;
  const matched = findBestRule(normalized, rules);
  if (matched) {
    return { key: matched.key, src: matched.src, alt: matched.alt };
  }

  return category === "調味料" ? imageForKey("seasoning") : null;
}

export function normalizeIngredientImageName(name: string) {
  return normalizeIngredientName(name);
}

export function resolveUserIngredientImage(
  name: string,
  userImages: readonly UserIngredientImage[]
): UserIngredientImage | null {
  const normalized = normalizeIngredientName(name);
  if (!normalized) return null;
  return userImages.find((image) => image.normalized_name === normalized && Boolean(image.image_storage_path)) ?? null;
}

function findBestRule(normalizedName: string, rules: readonly IngredientImageRule[]) {
  let best: { rule: IngredientImageRule; keywordLength: number } | null = null;

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeIngredientName(keyword);
      if (!normalizedName.includes(normalizedKeyword)) continue;

      if (!best || normalizedKeyword.length > best.keywordLength) {
        best = { rule, keywordLength: normalizedKeyword.length };
      }
    }
  }

  return best?.rule ?? null;
}

function imageForKey(key: string): StandardIngredientImage | null {
  const rule = IMAGE_RULES.find((item) => item.key === key);
  return rule ? { key: rule.key, src: rule.src, alt: rule.alt } : null;
}

function prioritizeSeasoningRules() {
  const preferredKeys = new Set(["seasoning", "oil", "curry"]);
  return [
    ...IMAGE_RULES.filter((rule) => preferredKeys.has(rule.key)),
    ...IMAGE_RULES.filter((rule) => !preferredKeys.has(rule.key))
  ];
}

function normalizeIngredientName(name: string) {
  return name.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
