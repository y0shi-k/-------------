---
id: SPEC-0170-web-ingredient-emoji-icons
title: 食材の絵文字アイコン化（在庫一覧＋AI食材登録の認識結果）
status: draft
scope:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 絵文字は装飾の追加のみ。在庫CRUD・消費量・期限・AI認識ロジックを変えない
  - 絵文字は TKT-0168 の `ingredientEmoji` / `<IngredientIcon>` 経由（直書き禁止）
  - schema / Storage / auth / RLS / AI route を変更しない
  - スマホの既存レイアウト・操作を変えない
acceptance:
  - 在庫一覧の食材行/グリッドに `<IngredientIcon>` が表示される
  - AI食材登録の認識結果リストにも `<IngredientIcon>` が表示される
  - 未一致食材は `🥘` にフォールバック、調味料も崩れない
  - 既存の在庫操作の挙動を変えない
  - Web版verifyが通る
related_tickets:
  - TKT-0170-web-ingredient-emoji-icons
---

# Summary

参考モック「食材一覧」のカラフルな食材アイコン表現に寄せる。在庫一覧とAI食材登録の認識結果に TKT-0168 の `<IngredientIcon>`（絵文字）を装飾として追加する。ロジックは変えない。

## 仕様

- `inventory-board.tsx` の食材行/グリッド先頭に `<IngredientIcon name={item.name} />`。
- AI食材登録（staging 認識結果）にも同コンポーネント。認識・保存ロジックは無改変。
- `globals.css` は TKT-0168 の `.ingredient-icon` を流用。

## 非対象

- 在庫/AIロジック変更。schema/Storage変更。

- 依存: TKT-0168 完了が前提。verify: `/verify`。Canvas版 `app.html` は触らない。スマホ温存。
- `ai_server_route` / `photo_upload_storage` eval が語彙で過剰マッチしうる（表示のみ・実ロジック/Storage無変更）→report に記録。
