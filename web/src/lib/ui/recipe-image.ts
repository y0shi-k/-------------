/**
 * レシピ名 → 静的デモ画像パスの解決（フロント・静的・schema非依存）。
 *
 * 画像は `web/public/images/recipes/recipe-<slug>.webp` に配置する。
 * 命名規約は `docs/design/demo-image-assets.md`、方針は `docs/design/pc-design-language.md` §8.3。
 * 将来 `recipes.image_path`（schema追加）へ差し替えても、このI/Fは変えない設計にする。
 */

const RECIPE_IMAGE_BASE = "/images/recipes";

/** 正規化済みレシピ名 → ファイル slug の静的map（別名は同じ slug に寄せる）。 */
const RECIPE_IMAGE_SLUGS: Record<string, string> = {
  鶏もも炒め: "chicken-stir-fry",
  鶏もも肉の炒め物: "chicken-stir-fry",
  肉じゃが: "nikujaga",
  ハンバーグ: "hamburg",
  麻婆豆腐: "mapo-tofu",
  マーボー豆腐: "mapo-tofu",
  鮭の塩焼き: "grilled-salmon",
  焼き鮭: "grilled-salmon",
  カレーライス: "curry-rice",
  カレー: "curry-rice",
  オムライス: "omurice",
  野菜炒め: "veggie-stir-fry",
  味噌汁: "miso-soup",
  みそ汁: "miso-soup",
  トマトパスタ: "tomato-pasta"
};

/** 表記ゆれ（全角空白・前後空白・互換文字）を吸収してmapキーへ寄せる。 */
function normalizeRecipeName(name: string): string {
  return name.normalize("NFKC").replace(/\s+/g, "");
}

export function resolveRecipeImage(recipe: { name: string; genre?: string[] }): string | null {
  if (!recipe?.name) {
    return null;
  }
  const slug = RECIPE_IMAGE_SLUGS[normalizeRecipeName(recipe.name)];
  return slug ? `${RECIPE_IMAGE_BASE}/recipe-${slug}.webp` : null;
}
