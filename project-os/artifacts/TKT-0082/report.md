# TKT-0082 Report

status: implemented

## Summary

料理記録カレンダーの過去予定を後日完了した場合に、料理履歴が完了当日へ残る不具合を修正した。

## Changes

- `completeRecipe()` で `_cookingScheduleItemId` から未完了スケジュールを特定できた場合、`scheduleItem.date` を料理履歴とレシピ履歴の日付に使うよう変更。
- スケジュールが特定できない直接調理は従来どおり完了操作日を使う。

## Verification

- 標準 verify は `VERIFY_PASSED`。
- native dialog 静的確認は該当なし。
- 新規の個別 `executeGAS(payload...)` 書き込みは追加なし。
- 詳細は `project-os/artifacts/TKT-0082/verify.json` を参照。
