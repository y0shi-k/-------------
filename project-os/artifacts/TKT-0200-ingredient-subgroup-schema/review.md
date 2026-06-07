---
ticket_id: TKT-0200-ingredient-subgroup-schema
status: passed
review_scope:
  - SPEC-0200-ingredient-subgroup-schema
  - TKT-0200-ingredient-subgroup-schema
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- `supabase/migrations/20260607120000_recipe_ingredient_subgroup.sql`
- `web/src/lib/recipes/types.ts`
- `web/src/app/page.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/lib/ai/recipe-generation.ts`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `web/src/__tests__/cooking-history-edit.test.ts`

## checked_artifacts

- `project-os/artifacts/TKT-0200-ingredient-subgroup-schema/verify.json`
- `project-os/artifacts/TKT-0200-ingredient-subgroup-schema/report.md`
- `project-os/artifacts/TKT-0200-ingredient-subgroup-schema/manual-smokes.md`

## subagent_usage

- なし（単一目的の schema 土台変更のため、メインセッションで diff レビューと verify を実施）。

## findings

- Blocking finding はありません。
- migration は列追加（`add column if not exists ... not null default 0 check (group_index >= 0)`）と複合索引追加のみ。`recipe_ingredients` のRLS policy（`auth.uid() = user_id` の select/insert/update/delete）は schema_v1 のまま変更なし。**個人データテーブルのRLSは追加カラム後も本人行に限定されている**（policy は行レベルで適用されるため、新カラムも同じ保護下に入る）。
- `not null default 0` により既存行は無害化。`check (group_index >= 0)` で不正値を拒否。
- 型変更（`RecipeIngredient.group_index` / `RecipeIngredientFormValues.group_index`）は一貫。`emptyRecipeIngredientFormValues`・`toRecipeFormValues`・AI生成 `normalizeIngredient` すべて 0 で補完し、UI 未実装でも常に未グループになる。
- 保存経路: `normalizeRecipeForm` は `group_index: 0` 固定（コメントで TKT-0201/0202 への委譲を明記）。`saveCookingReorder` は既存 `RecipeIngredient.group_index`（DBの 0）を書き戻すため回帰しない。
- 取得順 `item_type → group_index → sort_order` はコンポーネントの材料/調味料分離描画と矛盾しない（group_index=0 のみの現状で表示順不変）。
- Service Role Key・APIキーの直書きなし。`console.log` の残置なし。Storage・auth・API route の変更なし。
- Canvas版 `app.html` は変更していない。

## open_risks

- リモート/本番への migration 適用と適用後のRLSライブ確認は未実施（manual-smokes.md に手順あり、ユーザー実施が必要）。
- ラベル導出（A/B/C・あ/い/う）は仕様どおり本チケット非対象。後続UIチケットで実装する。

## verdict

- TKT-0200 の実装は、静的レビュー・自動verify（lint/typecheck/test/build）・テスト37件の範囲で受け入れ可能。ライブ migration 適用後のRLS確認をもって manual_smokes_done を最終クローズする。
