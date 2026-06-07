---
ticket_id: TKT-0198-edit-ingredient-reorder-dnd
status: ready
verified_at: 2026-06-07T11:11:18+09:00
---

# 実装レポート

## 変更目的

レシピ編集モーダルの材料・調味料を、全画面ビューと同じ3本線ハンドルのドラッグ&ドロップで並び替えられるようにした。これまで編集画面のハンドルは表示専用（`recipe-row-handle`、`aria-hidden`）でD&D非対応だった。

## 変更内容

- 編集モーダルの材料行・調味料行を `draggable` 化し、`onDragStart` / `onDragOver` / `onDragLeave` / `onDrop` を追加した。
- 並び替えの実体として `moveIngredient(fromIndex, targetType, targetSectionIndex)` を新設した。`recipeValues.ingredients` を immutable に入れ替えるだけの純粋な state 操作で、`updateIngredient` と同じ更新方針。
- 表示専用ハンドル `recipe-row-handle` を、全画面ビューと同じ3本線（☰）の操作可能ハンドル `cooking-row-drag-handle recipe-row-drag-handle` に置換した。`aria-label`（例: 「玉ねぎをドラッグして並び替え」）を付けた。
- 各セクション（材料 / 調味料）コンテナにもドロップを受けて末尾へ移動できるようにした。
- ドラッグ中・ドラッグオーバーの視覚フィードバックは全画面ビューの `is-dragging` / `is-dragover` に倣った。

## 今回追加した安全装置

- 並び替えは同一 `item_type` 内に限定。`moveIngredient` 冒頭で `moving.item_type !== targetType` の場合は何もしない（食材↔調味料をまたがない）。
- 保存は既存 `saveRecipe` → `normalizeRecipeForm`（表示順→`sort_order` 採番）をそのまま流用。新規DB書き込み・schema変更は追加していない。
- 既存の行追加（`addIngredientRow`）・削除（`removeIngredientRow`）・数量・単位編集には手を入れていない。
- DB schema、Storage、AI/API、認証/RLSは変更していない。
- Canvas版 `app.html` は編集していない。APIキー等の直書きはない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0198-edit-ingredient-reorder-dnd`: pass
  - lint: pass / typecheck: pass / test: pass / build: pass
  - policy: pass（GAS混入なし、秘密直書きなし、RLS確認、backlog focus lean）
- 追加テスト「reorders edit-modal food ingredients via drag and drop and persists sort_order」: 材料行をD&Dで並び替え、`レシピを更新` で `recipe_ingredients` insert ペイロードの `sort_order` が並び替え後の表示順どおりになることを確認。
- 追加テスト「keeps edit-modal reordering within a section and never crosses food/seasoning」: 食材を調味料行へドロップしてもセクションをまたがず、保存ペイロードの順序が変わらないことを確認。
- 既存36テストがすべてpass。

verify結果は `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/verify.json` に保存済み。

## schema/Storage 系evalについて（静的説明）

`required_evals` は `pwa_mobile_ui`。`/check-gates` が `recipes` 等の文言で schema/Storage 系evalを過剰検出する場合があるが、本変更は:

- migration追加なし（`supabase/` 配下に変更なし）。
- 新規DB書き込みなし（既存 `saveRecipe` の insert/update をそのまま流用）。
- カラム追加・RLS変更なし。

したがって schema/Storage/auth 系の追加成果物は不要。

## 残リスク

- HTML5 D&Dはスマホブラウザで操作しづらい場合がある。3本線ハンドルは操作目印として追加したが、実機での操作感確認は未実施。
- `moveIngredient` は並び替え時に配列を「食材→調味料」の順へ集約する（全画面ビュー `moveCookingIngredient` と同じ方針）。セクションは別々に描画されるため表示は不変だが、保存後の `sort_order` は食材が先・調味料が後にまとまる。

## 次の依頼や人判断

- 実機スマホで3本線ハンドルによるD&Dが操作しやすいか確認すると安心。
- サブグルーピング（TKT-0201 / TKT-0202）は本チケットの非対象。
