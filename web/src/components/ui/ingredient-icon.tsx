import { ingredientEmoji } from "@/lib/ui/ingredient-emoji";

type IngredientIconSize = "sm" | "md" | "lg";

type IngredientIconProps = {
  name: string;
  size?: IngredientIconSize;
  className?: string;
};

/**
 * 食材の絵文字を淡い円（`--accent-soft` 背景）に乗せて表示する。
 * 各画面は絵文字を直書きせず必ず本コンポーネントを経由する（正本 §8.6）。
 */
export function IngredientIcon({ name, size = "md", className }: IngredientIconProps) {
  const emoji = ingredientEmoji(name);
  const classNames = ["ingredient-icon", `ingredient-icon--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} role="img" aria-label={name || "食材"}>
      <span aria-hidden="true">{emoji}</span>
    </span>
  );
}
