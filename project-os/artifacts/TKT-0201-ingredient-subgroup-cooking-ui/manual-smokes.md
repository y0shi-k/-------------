---
ticket_id: TKT-0201-ingredient-subgroup-cooking-ui
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
---

# Manual Smokes

## target_evals

- `supabase_schema_change` 🔴: `/check-gates` が git diff のトークン（`recipe_ingredients` / `group_index`）で検出。**語彙の過剰マッチ**であり、実際の schema/migration 変更はない。

## executed_checks

- `git status --porcelain` で `supabase/` 配下・migration・`.sql` の変更が 0 件であることを静的確認した。今回の実コード変更は `web/src/components/recipe-meal-workspace.tsx` / `web/src/app/globals.css` / `web/src/__tests__/recipe-meal-workspace.test.tsx` のみ。
- 保存処理（`saveCookingReorder`）が `recipe_ingredients` の `item_type` / `sort_order` / `group_index` を update するだけで、DDL・テーブル定義・RLS・Storage には触れないことをコードで確認した。
- `group_index` カラムは TKT-0200 で追加済み。本チケットは利用のみで新規 migration は追加していない。

## skipped_checks

- 実DB（hosted Supabase）への適用・反映確認は不要（schema変更なしのため）。
- 実機/DevTools 375px でのサブグループ枠・選択ハイライト・タップ操作とD&Dの共存の目視は本 artifact の対象外（ユーザーの実機スモーク残作業）。

## open_risks

- なし（schema 観点）。UI 観点の実機目視はユーザー残作業として report.md に記載。
