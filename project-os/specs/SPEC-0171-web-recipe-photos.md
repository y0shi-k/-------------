---
id: SPEC-0171-web-recipe-photos
title: レシピの写真化（一覧カード＋レシピ詳細ヒーロー＋レシピ提案サムネ）
status: spec_ready
scope:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 写真は TKT-0168 の `<RecipeThumb>` / `resolveRecipeImage` 経由（`<img>` 直書き禁止）
  - TKT-0166（縦型カード/操作ボタン退避）・TKT-0167（お気に入り）の既存挙動を壊さない
  - 画像が無いフォールバック状態でも崩れない
  - schema / Storage / auth / RLS / AI route を変更しない
  - スマホの既存レイアウト・操作を変えない
acceptance:
  - レシピ一覧カードが `<RecipeThumb>` 写真表示になり、未一致はプレースホルダにフォールバック
  - レシピ詳細上部に `<RecipeThumb size="hero">` のヒーロー写真領域
  - レシピ提案（Batch）候補に `<RecipeThumb>` サムネ
  - お気に入りハート・タグ・操作ボタン退避を壊さない
  - Web版verifyが通る
related_tickets:
  - TKT-0171-web-recipe-photos
---

# Summary

TKT-0166 が用意した縦型レシピカードのプレースホルダ差し込み口に、TKT-0168 の `<RecipeThumb>` で実写真を流す。一覧・詳細・提案を写真主体の見た目にする。未一致はプレースホルダにフォールバック。

## 仕様

- 一覧カード: プレースホルダ部を `<RecipeThumb recipe={recipe} />` に置換（フォールバック維持）。
- 詳細: 上部に `<RecipeThumb size="hero" recipe={recipe} />`。
- 提案（Batch）: 候補に `<RecipeThumb>` サムネ。
- `globals.css` は TKT-0168 の `.recipe-thumb` 流用＋hero サイズ調整。

## 非対象

- 実画像配置（TKT-0172）。AI生成/認識ロジック変更。schema/Storage変更。

- 依存: TKT-0168 完了が前提。verify: `/verify`。Canvas版 `app.html` は触らない。スマホ温存。
- `photo_upload_storage` / `ai_server_route` eval が語彙で過剰マッチしうる（表示のみ・実ロジック/Storage無変更）→report に記録。
