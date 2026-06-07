---
ticket_id: TKT-0200-ingredient-subgroup-schema
status: ready
---

# Report Draft

## 変更目的

材料・調味料の中の「サブグループ」を永続化できるデータ土台を作り、後続のグルーピングUI（TKT-0201/0202）が乗れるようにする。本チケットは土台のみで、UI は実装せず常に `group_index=0`（未グループ）を保存し、見た目・挙動は従来と完全一致させる（回帰防止）。

## 今回追加した安全装置

- migration は「列追加のみ」に限定（`add column if not exists ... not null default 0 check (group_index >= 0)`）。既存行は default 0 で無害化され、policy/RLS/他テーブルは一切変更しない。
- 保存ペイロードは UI 未実装のため常に 0 を渡す（`normalizeRecipeForm` で `group_index: 0` 固定）。並び替え保存（`saveCookingReorder`）は既存 `RecipeIngredient.group_index`（=DBの 0）をそのまま書き戻す。
- 取得順は `item_type → group_index → sort_order` に拡張。材料/調味料はコンポーネント側で `item_type` により分離描画されるため、group_index=0 のみの現状では表示順は不変。

## 実施した確認

- Web版verify（`harness/bin/verify_web.sh TKT-0200-ingredient-subgroup-schema`）が lint/typecheck/test/build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）も pass。
- 既存テスト（`recipe-meal-workspace.test.tsx` の並び替え保存3件）を、追加された `group_index` 込みの update ペイロードに合わせて更新し、計37件 pass。
- 型（`RecipeIngredient` / `RecipeIngredientFormValues` / `emptyRecipeIngredientFormValues` / `toRecipeFormValues`）に `group_index` を追加。AI生成（`recipe-generation.ts`）の生成ペイロードも 0 で補完。
- migration が列追加のみで、RLS policy・他テーブル・Storage・auth・API route を変更していないことを diff で確認。

## 残リスク

- 本番/リモートSupabaseへの migration 適用と、適用後の「既存レシピが従来どおり表示・保存される」「他人の行が読めない（RLS）」のライブ確認は未実施（DB操作は明示依頼時のみのため）。manual-smokes.md に手順を残した。ユーザーによる適用・確認が必要。
- ラベル文字（A/B/C・あ/い/う）の導出関数は本チケットでは未実装（仕様どおり後続UIチケットに委譲）。

## 次の依頼や人判断

- migration `supabase/migrations/20260607120000_recipe_ingredient_subgroup.sql` を対象環境へ適用し、manual-smokes.md のライブ確認を実施してほしい。
- グルーピングUI（行選択・グルーピング・解除・ラベル表示）は TKT-0201（全画面）/ TKT-0202（編集）で実装する。
