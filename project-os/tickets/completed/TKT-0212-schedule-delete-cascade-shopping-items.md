---
id: TKT-0212-schedule-delete-cascade-shopping-items
title: スケジュール削除時に、その登録で追加した未購入の買い物リスト項目を連動削除（確認あり）
status: completed
goal: TKT-0211 でスケジュール登録時に在庫不足→買い物リスト追加できるようになったが、その後スケジュールを削除しても買い物リストの関連項目が残る。スケジュールと買い物項目を厳密リンク（meal_schedule_id）で結び、スケジュール削除時に「その登録で追加した未購入の買い物項目」を確認のうえ連動削除する。
acceptance:
  - shopping_items に meal_schedule_id（スケジュールへの紐付け）を新設する（複合FK・列指定 on delete set null・index）
  - TKT-0211 のスケジュール起点フロー（レシピ起点／「＋」picker 新規追加）で買い物追加した項目に meal_schedule_id が保存される
  - レシピ詳細の「買い物へ」や手動追加では meal_schedule_id は null（後方互換）
  - スケジュール削除時、その予定に紐づく status=未購入 の買い物項目を削除する（購入済みは残す）
  - 削除確認ダイアログに「未購入の買い物リスト項目も一緒に削除します」と明示する（確認あり）
  - 関連削除に失敗した場合は献立を削除せずエラーを出す（順序: 買い物削除→献立削除）
  - 既存の献立削除・完了解除・在庫巻き戻しの挙動を壊さない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - supabase_schema_change
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/20260609120000_shopping_items_meal_schedule_link.sql
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0212-schedule-delete-cascade-shopping-items/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0212-schedule-delete-cascade-shopping-items/verify.json
  - artifacts/TKT-0212-schedule-delete-cascade-shopping-items/report.md
  - artifacts/TKT-0212-schedule-delete-cascade-shopping-items/manual-smokes.md
  - artifacts/TKT-0212-schedule-delete-cascade-shopping-items/review.md
owner_role: implementer
owner_notes:
  - 危険変更（Supabase schema 変更＝migration 追加）。manual-smokes.md / review.md 必須
  - migration の本番適用（supabase db push 相当）はユーザー判断ゲート（公開前適用）
  - verify は `/verify TKT-0212`。コマンドの正本は `harness/registry.json`
  - 既存 RLS（auth.uid() = user_id）で参照・削除は自分の行に限定。新規ポリシー不要
---

# Summary

TKT-0211 でスケジュール登録時に在庫不足分を買い物リストへ追加できるようになった。しかし買い物項目は
`linked_recipe_name`（レシピ名）でしかレシピと結びついておらず、スケジュールへの紐付けが無い。そのため
スケジュールを削除しても買い物リストの関連項目が残る。

本チケットは `shopping_items` に `meal_schedule_id` を新設してスケジュールと厳密リンクし、スケジュール削除時に
その登録で追加した **未購入** の買い物項目を確認のうえ連動削除する。購入済みは残す。

## 実装メモ

- migration: `supabase/migrations/20260609120000_shopping_items_meal_schedule_link.sql`
  - `add column if not exists meal_schedule_id uuid`
  - 複合FK `(meal_schedule_id, user_id) references meal_schedules(id, user_id) on delete set null (meal_schedule_id)`
    （既存 `20260523095800_fix_composite_fk_delete_actions.sql` と同じ列指定 SET NULL。user_id は not null のため）
  - index `(user_id, meal_schedule_id)`
- `web/src/components/recipe-meal-workspace.tsx`
  - `addScheduleEntry` の戻り値を `string | null`（作成された献立 id）に変更（既存呼び出しは戻り値無視で非破壊）
  - 不足モーダルを開く際の紐付け state `shortageSelectionScheduleId` を新設。スケジュール起点
    （`assignScheduleFromRecipe`／`addScheduleFromPicker`）のときだけ set し、レシピ詳細起点は null
  - `confirmRecipeShortageSelection` の INSERT に `meal_schedule_id: shortageSelectionScheduleId` を追加
  - `deleteSchedule` で、献立削除の **前** に
    `shopping_items` を `meal_schedule_id = 当該 / user_id = 自分 / status = 未購入` で delete→select("id")
    （FK on delete set null より先に消す。順序厳守）。削除件数を成功フィードバックに表示
  - `scheduleDeleteMessage` に「未購入の買い物リスト項目も一緒に削除します」を追記（確認ダイアログ文面）

## 非ゴール

- 購入済み買い物項目の削除（残す）
- スケジュール「別のレシピに変更」(replace) やクイック追加フォームでの在庫チェック（TKT-0211 の範囲）
- 買い物リスト画面側のUI変更

## 依存チケット

- TKT-0211（レシピ→スケジュール登録時の在庫不足→買い物リスト追加）に依存

## 残リスク

- migration の本番適用が必要（未適用だと INSERT 時に meal_schedule_id 列が無くエラー）。公開前適用ゲート。
- 同一レシピを複数スロットに登録し各々で買い物追加した場合、削除は当該スケジュール紐付け分のみ（厳密リンクのため正確）。
