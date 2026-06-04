"use client";

import { useState } from "react";
import { resolveRecipeImage } from "@/lib/ui/recipe-image";

type RecipeThumbSize = "card" | "hero";

type RecipeThumbProps = {
  recipe: { name: string; genre?: string[] };
  size?: RecipeThumbSize;
  className?: string;
};

/** プレースホルダに置く頭文字（料理名の先頭1文字）。空なら汎用グリフ。 */
function placeholderGlyph(name: string): string {
  const trimmed = name.trim();
  return trimmed ? (Array.from(trimmed)[0] ?? "🍽") : "🍽";
}

/**
 * レシピのビジュアル領域。画像があれば 4:3 で表示し、無い/読込失敗時は
 * §3.5 のプレースホルダ（淡い背景＋頭文字）へフォールバックする。
 * 各画面は `<img>` を直書きせず必ず本コンポーネントを経由する（正本 §8.6）。
 */
export function RecipeThumb({ recipe, size = "card", className }: RecipeThumbProps) {
  const source = resolveRecipeImage(recipe);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(source) && !failed;

  const baseClassNames = ["recipe-thumb", `recipe-thumb--${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (!showImage || !source) {
    return (
      <div
        className={`${baseClassNames} recipe-thumb--placeholder`}
        role="img"
        aria-label={recipe.name}
      >
        <span aria-hidden="true">{placeholderGlyph(recipe.name)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 静的デモ画像。schema/Storage非依存で onError フォールバックを使うため next/image は使わない。
    <img
      className={baseClassNames}
      src={source}
      alt={recipe.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
