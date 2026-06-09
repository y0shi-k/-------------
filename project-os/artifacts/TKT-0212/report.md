---
ticket_id: TKT-0212-schedule-delete-cascade-shopping-items
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

TKT-0211 でスケジュール登録時に在庫不足分を買い物リストへ追加できるようになったが、その後その献立を
削除しても買い物リストの関連項目が残っていた。買い物項目は `linked_recipe_name`（レシピ名）でしか
レシピと結びついておらず、スケジュールへの紐付けが無かったため。

本変更で `shopping_items` に `meal_schedule_id` を新設してスケジュールと厳密リンクし、スケジュール削除時に
その登録で追加した **未購入** の買い物項目を、確認ダイアログの上で連動削除するようにした（購入済みは残す）。

## 今回追加した安全装置

- DB migration（`supabase/migrations/20260609120000_shopping_items_meal_schedule_link.sql`）:
  - `shopping_items.meal_schedule_id`（uuid, nullable）を追加。既存行・手動追加・レシピ詳細追加は null（後方互換）。
  - 複合FK `(meal_schedule_id, user_id) → meal_schedules(id, user_id)` を **列指定** `on delete set null (meal_schedule_id)`
    で付与（user_id は not null のため。既存 `20260523095800_fix_composite_fk_delete_actions.sql` と同じ方式）。
    アプリ側で削除前に明示削除するが、取りこぼし時の孤児FK違反を防ぐ保険。
  - index `(user_id, meal_schedule_id)` を追加。
  - **RLS は新規追加なし**: 既存 `shopping_items_*_own`（`auth.uid() = user_id`）で select/insert/update/delete を
    自分の行に限定済み。列追加は既存ポリシーの保護範囲内。
- `recipe-meal-workspace.tsx`:
  - 削除順序を厳守: `shopping_items` を `meal_schedule_id / user_id / status=未購入` で **先に** delete→select("id") し、
    その後 `meal_schedules` を delete（FK on delete set null より先に紐付けを使って消すため）。
  - 関連買い物削除が失敗したら **献立は削除しない**（エラー表示して中断）。
  - 紐付けは `shortageSelectionScheduleId` state を、スケジュール起点フロー
    （`assignScheduleFromRecipe` / `addScheduleFromPicker`）でのみ set。レシピ詳細「買い物へ」は明示的に null。
  - `addScheduleEntry` の戻り値を `string | null`（作成された献立 id）に変更（既存呼び出しは戻り値無視で非破壊）。
  - 削除確認ダイアログ文面（`scheduleDeleteMessage`）に「未購入の買い物リスト項目も一緒に削除します」を追記し、
    実削除件数を成功フィードバックに表示。

## 実施した確認

- `/verify TKT-0212`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。
  policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）も pass。
  結果は `project-os/artifacts/TKT-0212/verify.json`。
- 単体テスト（`web/src/__tests__/recipe-meal-workspace.test.tsx`、計54件 pass）に変更/追加:
  - 既存「deletes a meal schedule」: 関連買い物削除（未購入のみ）が `meal_schedule_id`/`status=未購入` で呼ばれること、
    0件なら文面に件数を出さないことを追加検証。
  - 追加「deletes related unpurchased shopping items …」: 関連2件削除→確認文面に連動削除明示→
    `meal_schedule_id`/`user_id`/`status` の絞り込みと「2件も削除しました」フィードバックを検証。
  - 追加「links shopping items to the schedule …」: レシピ起点登録→不足追加で `meal_schedule_id` が
    作成献立 id で保存されること。
  - 既存「deletes a completed meal schedule …」: shopping_items 連動削除を含め、完了解除＋在庫巻き戻し＋
    献立削除の順序が壊れないことを確認（確認文面も更新）。
- migration は静的レビューのみ（hosted DB 未適用）。SQL 構文・FK 方式・列指定 SET NULL は既存 migration を踏襲。

## 残リスク

- **migration の本番適用が未実施**。未適用の DB に対しては INSERT 時に `meal_schedule_id` 列が無く失敗する。
  公開前適用ゲート（`supabase db push` 相当）で適用が必要。`manual-smokes.md` の open_risks 参照。
- check-gates が `auth_and_rls_policy` / `photo_upload_storage` / `csv_import_migration` を語彙過剰マッチで
  危険判定するが、RLS ポリシー変更なし・Storage/写真無関係・CSV 移行無関係（実変更は schema 列追加のみ）。
- 実機での連動削除の体感（確認文面・削除件数表示・購入済みが残ること）は手動スモーク要。

## 次の依頼や人判断

- **本番 Supabase へ migration 適用**（公開前適用ゲート）。適用後にレシピ起点登録→買い物追加→
  スケジュール削除で関連未購入項目が消え、購入済みは残ることを実機確認。
- 手動スモーク: `manual-smokes.md` の executed_checks を実機で実施。
