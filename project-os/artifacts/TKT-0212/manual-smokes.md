---
ticket_id: TKT-0212-schedule-delete-cascade-shopping-items
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- supabase_schema_change（`shopping_items.meal_schedule_id` 追加・複合FK・index）
- pwa_mobile_ui（削除確認ダイアログ文面・連動削除のフィードバック）

## executed_checks

- `/verify TKT-0212`: lint / typecheck / test / build すべて pass（`verify.json`）。
- 単体テスト 54件 pass（連動削除の絞り込み条件・確認文面・件数フィードバック・meal_schedule_id 紐付けを含む）。
- migration SQL の静的レビュー: 列追加（nullable・後方互換）、複合FK の **列指定** `on delete set null (meal_schedule_id)`
  が既存 `20260523095800_fix_composite_fk_delete_actions.sql` と同方式であること、index 追加、RLS 新規不要を確認。

## skipped_checks

- hosted Supabase への migration 適用（`supabase db push` 相当）と実機 E2E。
  理由: 本番DB操作・公開適用は明示依頼のあるユーザー判断ゲート。ローカル/CI では静的検証に留めた。
- 実機（スマホ375px / PC）での削除確認ダイアログ表示・連動削除の体感確認。

## open_risks

- **migration 未適用リスク（最重要）**: 本番DBに `meal_schedule_id` 列が無い状態で本コードを公開すると、
  スケジュール起点の買い物追加 INSERT が列不一致で失敗する。**公開前に migration を必ず適用**すること。
- ユーザー実機確認推奨項目:
  1. レシピ起点（詳細ヘッダー／カード）でスケジュール登録→不足モーダルから買い物追加→
     スケジュール削除で当該未購入項目が買い物リストから消えること。
  2. スケジュール「＋」picker 新規追加でも同様に連動削除されること。
  3. 一度「購入済」にした項目は、スケジュール削除後も残ること。
  4. レシピ詳細「買い物へ」や手動追加した項目は、無関係なスケジュール削除で消えないこと（meal_schedule_id=null）。
  5. 削除確認ダイアログに「未購入の買い物リスト項目も一緒に削除します」が表示されること。
