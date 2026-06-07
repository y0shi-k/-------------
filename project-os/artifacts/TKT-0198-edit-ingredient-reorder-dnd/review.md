---
ticket_id: TKT-0198-edit-ingredient-reorder-dnd
status: passed
review_scope:
  - SPEC-0198-edit-ingredient-reorder-dnd
  - TKT-0198-edit-ingredient-reorder-dnd
---

# Review Record

## checked_diff_paths

- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/verify.json`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/report.md`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/manual-smokes.md`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/review.md`

## checked_artifacts

- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/verify.json`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/report.md`
- `project-os/artifacts/TKT-0198-edit-ingredient-reorder-dnd/manual-smokes.md`

## findings

- Blocking finding はありません。
- 並び替えの実体 `moveIngredient(fromIndex, targetType, targetSectionIndex)` は `recipeValues.ingredients` を immutable に入れ替える純粋な state 操作で、冒頭の `moving.item_type !== targetType` ガードにより食材↔調味料をまたぐ移動を確実に防いでいます。
- 保存は既存 `saveRecipe` → `normalizeRecipeForm`（表示順→`sort_order` 採番）を変更せず流用。新規DB書き込み経路・schema変更はありません。
- 表示専用ハンドル `recipe-row-handle` を操作可能ハンドル（`cooking-row-drag-handle recipe-row-drag-handle`、`aria-label` 付き）へ置換。全画面ビューの体験と揃っています。未使用となった `.recipe-row-handle` CSS は新ハンドル用ルールへ置換済み。
- 既存の行追加（`addIngredientRow`）・削除（`removeIngredientRow`）・数量・単位編集には手が入っていません。
- セクションコンテナへのドロップで末尾移動、行へのドロップでその位置へ移動と、ドロップ先 index を元配列の絶対 index へマップする実装になっています（`stopPropagation` で二重発火を防止）。
- APIキー、Service Role Key の直書きはありません。`console.log` の残置もありません。
- Canvas版 `app.html` は変更されていません。

## open_risks

- 実機スマホでのD&D操作感はユーザー環境で最終確認が必要です。
- `check-gates` は差分語彙により `supabase_schema_change`・`web_project_bootstrap` を検出しましたが、実際には schema/migration/Storage/RLS/auth/新規DB書き込みは変更していません。

## verdict

- TKT-0198の実装は、静的レビュー・自動verify（lint/typecheck/test/build）・追加テストを含む計37件の範囲で受け入れ可能です。
