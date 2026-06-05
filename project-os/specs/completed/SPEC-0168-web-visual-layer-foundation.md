---
id: SPEC-0168-web-visual-layer-foundation
title: ビジュアルレイヤー基盤（レシピ写真resolver・食材絵文字・共通サムネ/アイコン）
status: draft
scope:
  - docs/design/pc-design-language.md
  - web/src/lib/ui/recipe-image.ts
  - web/src/lib/ui/ingredient-emoji.ts
  - web/src/components/ui/recipe-thumb.tsx
  - web/src/components/ui/ingredient-icon.tsx
  - web/src/app/globals.css
  - web/public/images/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - schema / Supabase Storage / auth / RLS / AI route を変更しない（フロント静的・schema非依存）
  - 各画面は本基盤の resolver/コンポーネント経由で画像・絵文字を出す（直書き禁止）
  - 実画像はまだ置かない。フォールバックが成立すること
  - APIキー・写真URL・Service Role Keyをブラウザへ出さない
acceptance:
  - `resolveRecipeImage(recipe)` がレシピ名→静的画像パス、未一致は `null`
  - `ingredientEmoji(name)` がキーワード一致で絵文字、未一致は `🥘`
  - `<RecipeThumb>` が画像あり=4:3／なし=プレースホルダにフォールバック
  - `<IngredientIcon>` が絵文字を淡い円で表示
  - `.recipe-thumb` / `.recipe-thumb--placeholder` / `.ingredient-icon` を globals.css に追加
  - resolver/コンポーネントの単体テストがある
  - Web版verifyが通る
related_tickets:
  - TKT-0168-web-visual-layer-foundation
---

# Summary

参考モックのビジュアル（写真・絵文字）を全画面で統一トーンで出すための共通土台。`docs/design/pc-design-language.md` §8 を実装に落とし、後続の各画面チケット（0169〜0172）が同じ部品に乗れるようにする。

## 仕様

- `recipe-image.ts`: レシピ名正規化→静的mapで画像パス解決。`demo-image-assets.md` の命名（`recipe-<slug>.webp`）と一致。将来 `recipes.image_path` へ差し替えてもI/F不変。
- `ingredient-emoji.ts`: §8.3 の表をベースにキーワード部分一致。フォールバック `🥘`。lib に集約。
- `recipe-thumb.tsx` / `ingredient-icon.tsx`: props でサイズ吸収。画像 `onError` でプレースホルダ退避。
- `globals.css`: §8.5 のクラス。スマホ回帰なし。

## 非対象

- 実画像の配置（TKT-0172）。各画面への適用（TKT-0169〜0171）。schema/Storage変更。

- プロジェクト名: Stock Master。現役正本（編集対象）: `web/`, `supabase/`, `scripts/`。Canvas版 `app.html` は凍結・参照専用。
- verify: `/verify`（= `harness/bin/verify_web.sh`）。GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。
- `photo_upload_storage` eval は `画像/写真` 語彙で過剰マッチ（実Storage/schema無変更）→report に記録。
