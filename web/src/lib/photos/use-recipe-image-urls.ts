"use client";

import { useEffect, useState } from "react";
import type { SignedUrlCapableClient } from "@/lib/photos/user-image";
import { getCachedUserImageSignedUrl } from "@/lib/photos/signed-url-cache";

type RecipeWithImage = { id: string; image_storage_path: string | null };

/**
 * `image_storage_path` を持つレシピだけ署名付きURLを発行し、`recipe.id -> url` の Map を返す。
 * - 署名付きURLは短命なので、対象 path の集合が変わるたびに発行し直す。
 * - 失敗した path は Map に載せない（呼び出し側は固定デモ画像→プレースホルダへフォールバック）。
 * - 非公開 `photos` バケットのため、ブラウザに公開URLを保持しない。
 */
export function useRecipeImageUrls(recipes: RecipeWithImage[], client: SignedUrlCapableClient): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());

  // path の集合（id|path）が変わったときだけ再発行する。再レンダーごとの発行を避ける。
  const signatureKey = recipes
    .filter((recipe) => Boolean(recipe.image_storage_path))
    .map((recipe) => `${recipe.id}|${recipe.image_storage_path}`)
    .sort()
    .join(",");

  useEffect(() => {
    let active = true;
    const targets = recipes.filter((recipe) => Boolean(recipe.image_storage_path));

    if (targets.length === 0) {
      setUrls(new Map());
      return () => {
        active = false;
      };
    }

    async function resolveAll() {
      const entries = await Promise.all(
        targets.map(async (recipe) => {
          const url = await getCachedUserImageSignedUrl(client, recipe.image_storage_path);
          return url ? ([recipe.id, url] as const) : null;
        })
      );
      if (!active) return;
      setUrls(new Map(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
    }

    resolveAll();
    return () => {
      active = false;
    };
    // signatureKey が path 集合の変化を表す。client はメモ化済み参照。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureKey, client]);

  return urls;
}
