import Image from "next/image";
import { ingredientEmoji } from "@/lib/ui/ingredient-emoji";
import { resolveIngredientImage } from "@/lib/ui/ingredient-image";
import type { ItemCategory } from "@/lib/inventory/types";

type IngredientIconSize = "sm" | "md" | "lg";

type IngredientIconProps = {
  name: string;
  category?: ItemCategory;
  size?: IngredientIconSize;
  className?: string;
};

/**
 * 食材の標準画像を優先し、見つからない場合は絵文字へ戻す。
 * 各画面は表示を直書きせず必ず本コンポーネントを経由する（正本 §8.6）。
 */
export function IngredientIcon({ name, category, size = "md", className }: IngredientIconProps) {
  const image = resolveIngredientImage(name, category);
  const emoji = ingredientEmoji(name);
  const classNames = ["ingredient-icon", `ingredient-icon--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} data-has-standard-image={Boolean(image)} role="img" aria-label={name || "食材"}>
      {image ? <Image src={image.src} alt="" aria-hidden="true" width={64} height={64} /> : <span aria-hidden="true">{emoji}</span>}
    </span>
  );
}
