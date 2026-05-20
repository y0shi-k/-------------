# TKT-0070 Report

## Summary

スケジュールの各食事枠で、下部の横長 `＋` ボタンを廃止し、朝・昼・晩ヘッダー行の右側に小型 `＋` ボタンを配置した。

## Changed

- `renderSchedule()` のスロットヘッダーを `flex` 化。
- ヘッダー右側の小型 `＋` から既存の `openScheduleRecipePicker(date, meal)` を呼び出すようにした。
- 下部の dashed 横長追加ボタンを削除。
- TKT-0070 の spec / ticket / artifacts を追加。
- `AGENTS.md` に、AI は verify と静的確認を行い、Gemini Canvas のブラウザ実表示テストはユーザーが実施する旨を追記。

## Verification

- verify: passed.
- Static dialog check: passed.
- executeGAS call-site check: passed, no new call added.

## Remaining Manual Check

- GeminiCanvas での実表示確認はユーザーが実施。
