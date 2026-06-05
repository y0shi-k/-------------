---
id: TKT-0168-web-visual-layer-foundation
title: ビジュアルレイヤー基盤（レシピ写真resolver・食材絵文字・共通サムネ/アイコン）
status: draft
goal: 参考モックのような写真・絵文字を全画面で統一トーンで出すための共通土台（resolver＋共通コンポーネント＋CSS＋デザイン正本§8）を作り、TKT-0169〜0172が同じ部品に乗れるようにする
acceptance:
  - デザイン正本 `docs/design/pc-design-language.md` §8 に沿った共通土台が実装されている
  - `web/src/lib/ui/recipe-image.ts` … `resolveRecipeImage(recipe)` がレシピ名→静的デモ画像パスを返し、未一致は `null`（schema/Storage非依存）
  - `web/src/lib/ui/ingredient-emoji.ts` … `ingredientEmoji(name)` がキーワード一致で絵文字を返し、未一致は `🥘`
  - `web/src/components/ui/recipe-thumb.tsx` … `<RecipeThumb>` が画像あり=4:3画像／なし=プレースホルダ（§3.5）にフォールバックする
  - `web/src/components/ui/ingredient-icon.tsx` … `<IngredientIcon>` が絵文字を淡い円で表示する
  - `globals.css` に `.recipe-thumb` / `.recipe-thumb--placeholder` / `.ingredient-icon` を追加（PC基準・スマホ回帰なし）
  - 画像が1枚も無い状態でも全コンポーネントがプレースホルダで成立する（実画像はTKT-0172で配置）
  - resolver/コンポーネントの単体テストがある（フォールバック・絵文字マッチ）
  - schema / Supabase Storage / auth / RLS / AI route を変更しない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - docs/design/pc-design-language.md
  - docs/design/demo-image-assets.md
  - web/src/lib/ui/recipe-image.ts
  - web/src/lib/ui/ingredient-emoji.ts
  - web/src/components/ui/recipe-thumb.tsx
  - web/src/components/ui/ingredient-icon.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - web/public/images/
  - project-os/artifacts/TKT-0168-web-visual-layer-foundation/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0168-web-visual-layer-foundation
related_artifacts:
  - artifacts/TKT-0168-web-visual-layer-foundation/verify.json
  - artifacts/TKT-0168-web-visual-layer-foundation/report.md
owner_role: implementer
owner_notes:
  - これは **TKT-0169〜0172 の前提（依存元）**。先にこれを完了させてから各画面チケットに着手する。
  - 統一感の要。各画面は独自に `<img>`/絵文字を直書きせず、必ず本チケットの resolver/コンポーネントを経由させる（正本§8.6）。
  - 非危険変更（フロント静的・schema/Storage無変更）。ただし `photo_upload_storage` eval が `画像/写真` 語彙で過剰マッチする。実Storage/schema変更は無いので report に過剰マッチと記録（前例 TKT-0160/0166）。
  - 実画像はまだ置かない。`web/public/images/recipes/` は空 or README のみで可。フォールバックが成立することを確認する。
  - verify は `/verify TKT-0168`。Canvas版 `app.html` は触らない。対象は `web/` と `docs/`。
  - APIキー・秘密情報を直書きしない。`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
---

# Summary

参考モック（`レシピイメージ図`）のビジュアル（写真・絵文字）を全画面で**統一トーン**で出すための共通土台を作る。`docs/design/pc-design-language.md` §8 の規定を実装に落とし、後続の各画面チケット（0169〜0171）と実画像配置（0172）が同じ部品に乗れるようにする。

## 背景

- PCデスクトップ化（シェル/多カラム/縦型カード/お気に入り）は TKT-0157〜0167 で完了済み。
- 設計上、レシピカードは §3.5 で「写真なしプレースホルダ（差し込み口）」に意図的に止めていた。
- 参考モックとの差は**写真・絵文字のビジュアルレイヤー**。これを resolver＋共通コンポーネントとして一箇所に作り、画面間のトーンを揃える。

## 実装メモ

- `recipe-image.ts`: レシピ名を正規化して静的mapで画像パス解決。`demo-image-assets.md` のファイル名規約（`recipe-<slug>.webp`）と一致。将来 `recipes.image_path`（schema）へ差し替えてもI/Fを変えない設計。
- `ingredient-emoji.ts`: 正本§8.3 の表をベースにキーワード部分一致。フォールバック `🥘`。画面ごとに分散させずここに集約。
- `recipe-thumb.tsx` / `ingredient-icon.tsx`: props でサイズ吸収。画像 `onError` でプレースホルダ退避。
- `globals.css`: §8.5 のクラス追加。スマホ回帰なし（§6）。
- テスト: resolver の未一致→null、絵文字の代表一致＋フォールバック、`<RecipeThumb>` の画像なし=プレースホルダ。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。GAS/Spreadsheet/Drive を使わない。APIキー・秘密鍵は環境変数。

## 残リスク

- `photo_upload_storage` eval の過剰マッチ（語彙由来）。実Storage/schema変更は無い旨を report に記録する。
- 絵文字のOS/フォント差で見た目が揺れる（許容。装飾用途）。
- 実画像が揃うまでは全面プレースホルダ表示になる（想定どおり。0172で解消）。
