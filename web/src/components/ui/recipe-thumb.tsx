"use client";

import { useEffect, useState } from "react";
import { resolveRecipeImage } from "@/lib/ui/recipe-image";

type RecipeThumbSize = "card" | "hero";

type RecipeThumbProps = {
  recipe: { name: string; genre?: string[] };
  size?: RecipeThumbSize;
  className?: string;
  /**
   * ユーザー登録画像の署名付きURL（あれば最優先）。
   * 未指定または読込失敗時は固定デモ画像 → プレースホルダの順でフォールバックする。
   */
  imageUrl?: string | null;
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
export function RecipeThumb({ recipe, size = "card", className, imageUrl }: RecipeThumbProps) {
  // 表示優先順位（正本 §8.6 / SPEC-0174）:
  // 1) ユーザー登録画像の署名付きURL → 2) 固定デモ画像 → 3) 頭文字プレースホルダ。
  const [userImageFailed, setUserImageFailed] = useState(false);
  const [demoImageFailed, setDemoImageFailed] = useState(false);

  // URL が差し替わったら失敗フラグを戻す（差し替え後の再表示を反映）。
  useEffect(() => {
    setUserImageFailed(false);
  }, [imageUrl]);

  const demoSource = resolveRecipeImage(recipe);
  const userSource = imageUrl && !userImageFailed ? imageUrl : null;
  const source = userSource ?? (demoSource && !demoImageFailed ? demoSource : null);
  const isUserSource = Boolean(userSource);

  const baseClassNames = ["recipe-thumb", `recipe-thumb--${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (!source) {
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
    // eslint-disable-next-line @next/next/no-img-element -- 署名付きURL/静的デモ画像。onError フォールバックを使うため next/image は使わない。
    <img
      className={baseClassNames}
      src={source}
      alt={recipe.name}
      loading="lazy"
      onError={() => (isUserSource ? setUserImageFailed(true) : setDemoImageFailed(true))}
    />
  );
}
