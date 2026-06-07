---
id: TKT-0200-ingredient-subgroup-schema
title: 材料・調味料サブグループのDB土台（schema＋型＋読み書き）
status: completed
goal: 材料/調味料の中のサブグループを永続化できるデータ基盤を作り、後続のグルーピングUI（TKT-0201/0202）が乗れる土台を整える。
acceptance:
  - `recipe_ingredients` にサブグループ識別カラム `group_index integer not null default 0`（0=未グループ、`check (group_index >= 0)`）が migration で追加される
  - 既存レシピは migration 適用後も `group_index=0` で従来どおり表示・保存される（挙動の見た目変化なし）
  - `RecipeIngredient` に `group_index: number`、`RecipeIngredientFormValues` に対応フィールドが追加される
  - 材料・調味料の取得順が `item_type, group_index, sort_order` の複合順になる
  - `saveRecipe` / `saveCookingReorder` の保存ペイロードに `group_index` が含まれる（UI未実装段階は常に 0 を保存）
  - 新カラム追加後も `recipe_ingredients` のRLSが本人行のみに限定されている（policy自体は変更しない）
  - 写真Storage・AI/API・auth/RLS policy は変更しない
  - Web版verify（typecheck/build）が通る
required_evals:
  - supabase_schema_change
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/
  - web/src/lib/recipes/types.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/page.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0200-ingredient-subgroup-schema/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0200-ingredient-subgroup-schema
related_artifacts:
  - artifacts/TKT-0200-ingredient-subgroup-schema/verify.json
  - artifacts/TKT-0200-ingredient-subgroup-schema/manual-smokes.md
  - artifacts/TKT-0200-ingredient-subgroup-schema/review.md
  - artifacts/TKT-0200-ingredient-subgroup-schema/report.md
owner_role: implementer
owner_notes:
  - 【危険変更】supabase_schema_change。RLSが本人データ限定であることを確認できるまで完了にしない。manual-smokes.md / review.md 必須。
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。APIキー・Supabase秘密鍵を直書きしない。service role keyをブラウザで使わない。
  - 既存schemaは `supabase/migrations/20260523094705_schema_v1.sql` の `recipe_ingredients`（L84〜、`recipe_ingredients_user_recipe_idx (user_id, recipe_id, sort_order)`）。これに倣う。
  - migrationは「列追加のみ」に限定する。既存policy/RLS/他テーブルは触らない。`add column if not exists ... default 0` で既存行を無害化する。
  - 型は `web/src/lib/recipes/types.ts` の `RecipeIngredient` / `RecipeIngredientFormValues`。`group_index` を追加する。
  - 取得順は `web/src/app/page.tsx`（~L64 `.order("sort_order")`）を `item_type → group_index → sort_order` の複合順に拡張。`recipe-meal-workspace.tsx` 内のソート前提（材料/調味料の分離やdraft生成）と矛盾しないか確認する。
  - 保存は `saveRecipe`（~L1011）と `saveCookingReorder`（~L1703）のペイロードに `group_index` を含める。UI未実装の本チケットでは常に 0 を保存し、見た目・挙動は従来と完全一致にする（回帰防止）。
  - ラベル文字（A/B/C・あ/い/う）はDBに持たない。番号→ラベルの導出は後続UIチケットで実装する（本チケットでは導出関数の置き場所だけ用意してもよいが必須ではない）。
  - manual-smokes.md: migration適用後に「既存レシピが従来どおり表示・保存される」「新規でgroup_index=0以外を直接INSERTしても本人以外から読めない（RLS）」を確認する。
  - review.md: 個人データテーブルのRLSが追加カラム後も有効か、service role keyがブラウザに出ていないか、policy未変更かを確認する。
  - verify は `/verify TKT-0200-ingredient-subgroup-schema`。
---

# Summary

`recipe_ingredients` にサブグループ番号 `group_index`（0=未グループ）を追加し、型・取得順・保存ペイロードを土台として整える。本チケットでは UI を実装せず常に 0 を保存して見た目・挙動を従来と一致させる。グルーピングUIは TKT-0201 / TKT-0202 が乗る。

## 実装メモ

- migration: `alter table public.recipe_ingredients add column if not exists group_index integer not null default 0;` ＋ `check (group_index >= 0)`。索引は任意。
- 取得順を `item_type, group_index, sort_order` に統一し、全画面ビューのdraft生成（`buildCookingIngredientDrafts` ~L185）と編集の材料分離（`foodIngredientEntries` / `seasoningIngredientEntries` ~L462）が整合するか確認。
- 保存ペイロードに `group_index` を追加。`normalizeRecipeForm`（`saveRecipe` 経由）と `saveCookingReorder` の両方。
- 回帰確認: グルーピングUI無しの状態で、既存レシピの表示順・保存往復が変わらないこと。

## 非対象

- グルーピングUI（選択・グルーピングボタン・解除・ラベル表示）= TKT-0201 / TKT-0202
- RLS policy 自体の変更、他テーブル変更
- 任意グループ名（自動ラベルのみ）

## 依存チケット

- なし（TKT-0201 / TKT-0202 の土台）
