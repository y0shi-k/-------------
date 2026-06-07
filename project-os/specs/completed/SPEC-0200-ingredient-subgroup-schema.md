---
id: SPEC-0200-ingredient-subgroup-schema
title: 材料・調味料のサブグループを永続化するデータ土台
status: draft
scope:
  - `recipe_ingredients` テーブルへのサブグループ識別カラム追加（migration）
  - TypeScript型（RecipeIngredient / RecipeIngredientFormValues）への反映
  - 材料・調味料の取得順とグループ読み書きロジックの土台
constraints:
  - 既存データは無害（新カラムは default で未グループ扱い）であること
  - 既存のRLSが新カラム追加後も本人データに限定されていること（policy自体は変更しない）
  - サブグループのラベル文字（A/B/C・あ/い/う）はDBに持たず、番号から表示時に導出する
  - 写真Storage・AI/API は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - APIキー・Supabase秘密鍵を直書きしない。service role keyをブラウザで使わない
acceptance:
  - `recipe_ingredients` にサブグループ識別カラム `group_index integer not null default 0` が追加される（0=未グループ）
  - 既存レシピは migration 適用後も `group_index=0` で従来どおり表示される
  - `RecipeIngredient` / `RecipeIngredientFormValues` 型に group_index 相当のフィールドが追加される
  - 材料・調味料の取得順が `item_type, group_index, sort_order` になる
  - `saveRecipe` / `saveCookingReorder` の保存に group_index が含まれる（UI未実装の段階では常に 0 を保存し、挙動は従来と同一）
  - 新カラム追加後も `recipe_ingredients` のRLSが本人行のみに限定されている
  - Web版verify（typecheck/build）が通る
related_tickets:
  - TKT-0200-ingredient-subgroup-schema
---

# Summary

材料の中・調味料の中をサブグループに分けて永続保存できるよう、`recipe_ingredients` にサブグループ番号カラムを追加し、型と読み書きを土台として整える。UI（選択・グルーピング・解除・ラベル表示）は TKT-0201 / TKT-0202 で実装する。本チケットは土台のみで、見た目・挙動は従来と変えない（常に未グループ=0）。

## 背景

現在の `recipe_ingredients` は `item_type('食材'|'調味料')` と `sort_order` のみで、材料/調味料の中のサブグループを表現できない（`supabase/migrations/20260523094705_schema_v1.sql` L84〜）。サブグループを編集・全画面の両画面で永続保持したいという要望のため、まずデータ土台を作る。

## 仕様

- migration を追加（`supabase/migrations/<timestamp>_recipe_ingredient_subgroup.sql`）:
  - `alter table public.recipe_ingredients add column if not exists group_index integer not null default 0;`
  - `check (group_index >= 0)` 制約を付ける。
  - 既存の `recipe_ingredients_user_recipe_idx` に倣い、必要なら `(user_id, recipe_id, item_type, group_index, sort_order)` の索引追加を検討（必須ではない）。
- 型: `web/src/lib/recipes/types.ts` の `RecipeIngredient` に `group_index: number`、`RecipeIngredientFormValues` に対応フィールドを追加。
- 取得: `web/src/app/page.tsx`（~L64 の `.order("sort_order")`）を `item_type, group_index, sort_order` の複合順に拡張。
- 保存: `saveRecipe` / `saveCookingReorder` のペイロードに `group_index` を含める。UI未実装段階は常に 0。
- ラベル導出方針（UIチケットで使う土台メモ）: 食材は group_index>0 を A,B,C…、調味料は あ,い,う… に対応させる。文字はDBに持たず導出関数で生成する。

## 非対象

- グルーピングUI（行選択・グルーピングボタン・解除・ラベル表示）= TKT-0201 / TKT-0202
- RLS policy 自体の変更（追加カラムは既存の行レベルpolicyでそのまま保護される）
- 任意グループ名の付与（自動ラベルのみ）
