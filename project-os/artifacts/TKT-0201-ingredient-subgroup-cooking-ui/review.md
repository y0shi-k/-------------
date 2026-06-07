---
ticket_id: TKT-0201-ingredient-subgroup-cooking-ui
status: passed
review_scope:
  - SPEC-0201-ingredient-subgroup-cooking-ui
  - TKT-0201-ingredient-subgroup-cooking-ui
---

# Review Record

## checked_diff_paths

- `web/src/components/recipe-meal-workspace.tsx`（選択state、`toggleCookingIngredientSelection` / `groupSelectedCookingIngredients` / `clearCookingIngredientGroup` / `ungroupSelectedCookingIngredients` / `ungroupCookingSubgroup`、`moveCookingIngredient` の group_index 継承、CookingViewer のサブグループ描画と `renderIngredientCard`、`subgroupLabel` / `subgroupRankMap` / `regroupCookingDrafts`、`sameIngredientOrder` への group_index 比較追加）
- `web/src/app/globals.css`（`cooking-ing-group-head` / `cooking-group-action` / `cooking-ing-subgroup` 系 / `cooking-ing-card[data-selected]`）
- `web/src/__tests__/recipe-meal-workspace.test.tsx`（グルーピング/解除/混在不可/ひらがな採番の4テスト追加）

## checked_artifacts

- `project-os/artifacts/TKT-0201-ingredient-subgroup-cooking-ui/verify.json`（status=pass、policy 全 pass）
- `project-os/artifacts/TKT-0201-ingredient-subgroup-cooking-ui/report.md`
- `project-os/artifacts/TKT-0201-ingredient-subgroup-cooking-ui/manual-smokes.md`

## subagent_usage

- 使用なし（単一コンポーネント中心のUI変更のため、メインセッションで実装・レビュー）。

## findings

- schema/Storage/auth/AI/移行の変更なし。`supabase_schema_change` 🔴 は語彙の過剰マッチ（`git status` で `supabase/`・migration・`.sql` の変更 0 件を確認）。
- 選択の item_type 限定、未使用 `group_index` 割り当て、欠番吸収（出現順 rank）、D&Dの group_index 継承、ハンドルクリックの `stopPropagation` による選択トグルとの非競合、いずれも acceptance と一致。
- `sameIngredientOrder` に group_index 比較を追加したことで、位置不変のグルーピング/解除でも確定ボタンが有効化されることを確認。
- 保存は `recipe_ingredients` の `item_type`/`sort_order`/`group_index` 更新に限定。

## open_risks

- 実機（スマホ375px）でのサブグループ枠・選択ハイライト・タップ/D&D共存の目視はユーザー残作業。
- 編集画面側UI（TKT-0202）は非対象。共通ロジックは流用可能な形で配置済み。

## verdict

- pass（acceptance 充足、verify 全 pass、危険変更の実体なし）。
