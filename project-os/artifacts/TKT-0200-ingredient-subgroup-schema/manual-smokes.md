---
ticket_id: TKT-0200-ingredient-subgroup-schema
status: passed
execution_mode: static_and_pending_live
target_evals:
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `recipe_ingredients` に `group_index integer not null default 0 check (group_index >= 0)` が追加されること
- 既存レシピが migration 適用後も `group_index=0` で従来どおり表示・保存されること
- 新カラム追加後も `recipe_ingredients` のRLSが本人行のみに限定されること（他人の行を読めない）
- 取得順が `item_type → group_index → sort_order` の複合順になること
- 保存ペイロード（`saveRecipe` / `saveCookingReorder`）に `group_index` が含まれ、UI未実装段階では常に 0 になること
- Storage・AI/API・auth/RLS policy を変更していないこと

## executed_checks

- Web版verify（`harness/bin/verify_web.sh TKT-0200-ingredient-subgroup-schema`）が lint/typecheck/test/build すべて pass。
- 自動テスト `recipe-meal-workspace.test.tsx`（計37件）pass。並び替え保存テスト3件で、`recipe_ingredients` の update ペイロードが `{ item_type, sort_order, group_index: 0 }` になることを検証。
- diff 確認: migration は `recipe_ingredients` への列追加と複合索引追加のみ。`drop policy` / `create policy` / RLS / Storage / auth / API route の変更なし。既存 policy（`recipe_ingredients_select_own` 等、`auth.uid() = user_id`）は schema_v1 のまま不変であることを確認。
- 取得順の変更は `web/src/app/page.tsx` の `.order("item_type") .order("group_index") .order("sort_order")` のみ。コンポーネントは `item_type` で材料/調味料を分離描画するため group_index=0 のみの現状では表示順不変であることをコード確認。

## skipped_checks

- リモート/本番Supabaseへの migration 適用は未実施（DB操作は明示依頼時のみ）。適用後の以下ライブ確認はユーザー実施が必要:
  1. 既存レシピを開く→材料・調味料の表示順が従来どおりであること。
  2. 既存レシピを編集して保存→往復で順序・内容が変わらないこと（`group_index` は 0 のまま）。
  3. 別ユーザーでログインし、自分以外の `recipe_ingredients` 行（group_index を直接 INSERT したものを含む）が select で返らないこと（RLS）。
  - 確認SQL例（Supabase SQL Editor、本人セッションで）:
    `select id, item_type, group_index, sort_order from recipe_ingredients order by item_type, group_index, sort_order;`

## open_risks

- ライブ環境での migration 適用とRLS確認が未実施。完了判定（manual_smokes_done の最終クローズ）は、ユーザーによる上記ライブ確認の完了をもって確定する。
- 本変更は静的に schema 追加・型・取得順・保存ペイロードの整合を確認済みだが、実DBの既存行件数・分布による予期せぬ挙動は実適用で最終確認すること。
