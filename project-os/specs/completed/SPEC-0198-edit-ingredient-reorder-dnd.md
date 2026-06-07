---
id: SPEC-0198-edit-ingredient-reorder-dnd
title: レシピ編集画面の材料・調味料をドラッグ&ドロップで並び替える
status: draft
scope:
  - レシピ編集モーダルの材料入力セクション
  - レシピ編集モーダルの調味料入力セクション
  - 行左側のドラッグハンドル（3本線）表示
constraints:
  - 並び替えは編集モーダル内の一時stateで完結し、保存は既存 `saveRecipe` フローに乗せる
  - 保存対象は既存カラム `recipe_ingredients.sort_order`（既存どおり index から採番）
  - 材料と調味料はセクション分離を維持し、セクションをまたぐ移動はしない
  - DB schema、Storage、AI/API、auth/RLS は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 編集モーダルの材料行をドラッグ&ドロップで並び替えできる
  - 編集モーダルの調味料行をドラッグ&ドロップで並び替えできる
  - 行左側に全画面ビューと同じ3本線のドラッグハンドルが表示される（従来の表示専用 `=` ハンドルを置換）
  - 並び替えは材料セクション内・調味料セクション内に限定され、セクションをまたがない
  - 並び替え後に `保存` すると、その表示順が `recipe_ingredients.sort_order` に反映される
  - 保存後に再表示しても並び順が維持される
  - 既存の行追加・削除・数量・単位編集は壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0198-edit-ingredient-reorder-dnd
---

# Summary

全画面ビュー（CookingViewer）で実装済みの3本線ハンドルによる並び替え体験を、レシピ編集モーダルの材料・調味料行にも展開する。並び順は編集モーダル内の一時stateで保持し、既存の保存フロー（`saveRecipe` が index から `sort_order` を採番）にそのまま乗せる。

## 背景

TKT-0197 で全画面ビューに3本線ハンドルD&D並び替えを実装したが、編集画面の材料・調味料行はハンドル `recipe-row-handle` が表示専用（`aria-hidden`）でD&D非対応のまま。編集画面でも同じ操作感で並び替えたいという要望。

## 仕様

- 対象は `web/src/components/recipe-meal-workspace.tsx`（編集モーダル ~L2336〜2438）と `web/src/app/globals.css`。
- 材料・調味料の各行を `draggable` 化し、`onDragStart` / `onDragOver` / `onDrop` で同一セクション内の並び替えを行う。
- 並び替えの実体は `recipeValues` の材料配列を入れ替える state 操作（既存 `updateIngredient` と同じ immutable 更新方針）。新規の並び替え用 move 関数を追加する。
- ハンドルは全画面ビューの `cooking-row-drag-handle`（☰）相当に揃える。CSS は流用または近い見た目で新設。
- 保存は既存 `saveRecipe`（~L1011）を変更せず流用。`normalizeRecipeForm` が表示順から `sort_order` を採番する既存挙動に依存する。

## 非対象

- 材料↔調味料をまたぐ移動（全画面ビューのみの挙動。編集画面はセクション固定）
- サブグルーピング（TKT-0201 / TKT-0202 で対応）
- DB schema変更
