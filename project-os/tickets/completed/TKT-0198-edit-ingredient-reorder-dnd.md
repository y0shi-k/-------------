---
id: TKT-0198-edit-ingredient-reorder-dnd
title: レシピ編集画面の材料・調味料をD&Dで並び替え（3本線ハンドル）
status: completed
verified_at: 2026-06-07T11:11:18+09:00
goal: 全画面ビューと同じ3本線ハンドルD&D並び替えを編集モーダルにも導入し、編集画面でも材料・調味料の順番を直感的に変えられるようにする。
acceptance:
  - 編集モーダルの材料行をドラッグ&ドロップで並び替えできる
  - 編集モーダルの調味料行をドラッグ&ドロップで並び替えできる
  - 行左側に全画面ビュー（`cooking-row-drag-handle`）と同等の3本線ハンドルが表示される
  - 並び替えは材料セクション内・調味料セクション内に限定され、セクションをまたがない
  - 並び替え後に保存すると、その表示順が `recipe_ingredients.sort_order` に反映される
  - 保存後に再表示しても並び順が維持される
  - 既存の行追加（`addIngredientRow`）・行削除（`removeIngredientRow`）・数量・単位編集は壊れない
  - DB schema変更はしない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0198-edit-ingredient-reorder-dnd
related_artifacts:
  - artifacts/TKT-0198-edit-ingredient-reorder-dnd/verify.json
  - artifacts/TKT-0198-edit-ingredient-reorder-dnd/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。
  - 対象は編集モーダル（`web/src/components/recipe-meal-workspace.tsx` の ~L2336〜2438）と `globals.css`。
  - 参照実装は全画面ビュー（CookingViewer）の `moveCookingIngredient`（~L1651）と `cooking-row-drag-handle`（globals.css ~L3544）。D&DはHTML5 Drag and Drop APIで揃える。
  - 並び替えは `recipeValues` の材料配列を immutable に入れ替える move 関数を新設する（既存 `updateIngredient` ~L585 と同じ更新方針）。
  - 材料エントリ・調味料エントリは `foodIngredientEntries` / `seasoningIngredientEntries`（~L462）で分離済み。D&Dは同一 item_type 内に限定し、ドロップ先の index 計算は元配列の絶対 index にマップすること。
  - 保存は既存 `saveRecipe`（~L1011）と `normalizeRecipeForm`（表示順→`sort_order` 採番）を変更せず流用する。新たなDB書き込みは追加しない。
  - 既存の表示専用ハンドル `recipe-row-handle`（`aria-hidden`）を操作可能ハンドルに置換する。アクセシビリティ用に `aria-label` を付ける。
  - テストでは、材料/調味料行を並び替えた後の `recipeValues` 配列順、保存ペイロードの `sort_order` 採番、セクションをまたがないことを確認する。
  - `/check-gates` が文言（`recipes` 等）で schema/Storage 系evalを過剰検出する場合は、report で「migration追加なし・新規DB書き込みなし」を静的に示す。
  - verify は `/verify TKT-0198-edit-ingredient-reorder-dnd`。
---

# Summary

レシピ編集モーダルの材料・調味料行に、全画面ビューと同等の3本線ハンドルD&D並び替えを追加する。並び順は編集モーダル内の一時stateで保持し、既存の保存フロー（`saveRecipe` → `sort_order` 採番）に乗せる。新規DB書き込み・schema変更はしない。

## 実装メモ

- 材料・調味料の各行に `draggable`、`onDragStart`（`dataTransfer` に行ID/index）、`onDragOver`（`preventDefault`）、`onDrop`（move実行）を付ける。
- move関数は `recipeValues` の材料配列をコピーして対象要素を移動する純粋関数にし、同一 item_type 内に限定する。
- ドラッグ中・ドラッグオーバーの視覚フィードバックは全画面ビューの `is-dragging` / `is-dragover` クラスに倣う。
- ハンドルCSSは `cooking-row-drag-handle` を流用または編集モーダル用に近い見た目で新設する。

## 非対象

- 材料↔調味料をまたぐ移動（編集画面はセクション固定）
- サブグルーピング（TKT-0201 / TKT-0202）
- DB schema変更・新規DB書き込み

## 依存チケット

- なし（独立して着手可）
