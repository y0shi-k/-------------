---
id: SPEC-0082-scheduled-completion-date-preservation
title: 予定日からの料理完了日付保持
status: ready
scope:
  - 料理記録カレンダーの予定カードから開始した料理完了
  - 料理履歴とレシピ履歴の日付決定
constraints:
  - 料理履歴シートのスキーマは変更しない
  - スプレッドシート書き込みは既存の `state.pendingSync` + `syncPendingChanges()` 経由を維持する
  - `executeGAS(payload...)` の個別書き込み通信を増やさない
acceptance:
  - 過去日の予定を料理記録カレンダーから開いて完了した場合、料理履歴の日付は予定日になる
  - 過去日の予定を完了しても、完了当日のカレンダーセルに履歴が作られない
  - 予定に紐づかない直接調理は従来どおり完了当日の日付になる
  - 該当スケジュールは予定日を保持したまま `完了` に更新される
related_tickets:
  - TKT-0082-scheduled-completion-date-preservation
---

# Summary

予定から開始した料理完了では、実際にボタンを押した日ではなく、紐づく献立スケジュールの予定日を料理履歴・レシピ履歴の日付として扱う。

## 仕様

- `completeRecipe()` は `_cookingScheduleItemId` で未完了スケジュールを特定できた場合、`scheduleItem.date` を `cookingDate` の日付部分に使う。
- 時刻部分、写真ファイル名、`lastEdited` は完了操作時の現在時刻を使う。
- `_cookingScheduleItemId` がない、または該当スケジュールを特定できない場合は、従来どおり完了操作時の日付を使う。
- `recipe.history` と `pendingSync.recipeHistory[].cookingDate` も料理履歴と同じ日付を使う。

## 非対象

- 料理履歴シートへの列追加
- 完了後に任意の日付へ手動変更するUI
- GASデプロイ作業
