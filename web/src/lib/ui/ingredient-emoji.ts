/**
 * 食材名 → 絵文字（部分一致のキーワード表）。フォールバック `🥘`。
 *
 * 設計正本 `docs/design/pc-design-language.md` §8.3。絵文字は装飾用途。
 * 画面ごとに分散させず、必ずこの lib に集約する。
 */

export const INGREDIENT_EMOJI_FALLBACK = "🥘";

type EmojiRule = { emoji: string; keywords: string[] };

/**
 * 上から順にマッチ（より具体的な肉・魚を先に置き、汎用の「肉」「菜」は後段で拾う）。
 * 同じ絵文字でも別表記を拾えるよう keywords を厚めにする。
 */
const EMOJI_RULES: readonly EmojiRule[] = [
  { emoji: "🍗", keywords: ["鶏", "鳥", "チキン", "とり", "ささみ", "手羽"] },
  { emoji: "🥓", keywords: ["豚", "ポーク", "ベーコン", "ハム"] },
  { emoji: "🥩", keywords: ["牛", "ビーフ", "ステーキ", "ひき肉", "挽肉", "合いびき", "肉"] },
  { emoji: "🐟", keywords: ["鮭", "さけ", "サーモン", "魚", "さば", "鯖", "さんま", "あじ", "ぶり", "まぐろ", "たら", "ししゃも"] },
  { emoji: "🦐", keywords: ["えび", "海老", "エビ"] },
  { emoji: "🥚", keywords: ["卵", "玉子", "たまご"] },
  { emoji: "🥛", keywords: ["牛乳", "ミルク"] },
  { emoji: "🧀", keywords: ["チーズ"] },
  { emoji: "🍚", keywords: ["米", "ごはん", "ご飯", "飯", "ライス"] },
  { emoji: "🍞", keywords: ["パン", "食パン"] },
  { emoji: "🍲", keywords: ["豆腐", "大豆", "厚揚げ", "油揚げ"] },
  { emoji: "🍅", keywords: ["トマト"] },
  { emoji: "🥕", keywords: ["にんじん", "人参", "ニンジン"] },
  { emoji: "🧅", keywords: ["玉ねぎ", "たまねぎ", "玉葱", "オニオン", "長ねぎ", "ねぎ", "ネギ"] },
  { emoji: "🥔", keywords: ["じゃがいも", "ジャガイモ", "芋", "ポテト"] },
  { emoji: "🍄", keywords: ["きのこ", "しいたけ", "椎茸", "しめじ", "えのき", "まいたけ", "エリンギ"] },
  { emoji: "🥦", keywords: ["ブロッコリー"] },
  { emoji: "🥬", keywords: ["キャベツ", "レタス", "白菜", "ほうれん草", "小松菜", "青梗菜", "菜"] },
  { emoji: "🍆", keywords: ["なす", "ナス", "茄子"] },
  { emoji: "🫑", keywords: ["ピーマン", "パプリカ"] },
  { emoji: "🌽", keywords: ["とうもろこし", "コーン"] },
  { emoji: "🧂", keywords: ["醤油", "しょうゆ", "塩", "砂糖", "油", "味噌", "みそ", "酢", "みりん", "だし", "出汁", "調味料"] }
];

export function ingredientEmoji(name: string): string {
  if (!name) {
    return INGREDIENT_EMOJI_FALLBACK;
  }
  const normalized = name.normalize("NFKC");
  for (const rule of EMOJI_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.emoji;
    }
  }
  return INGREDIENT_EMOJI_FALLBACK;
}
