---
ticket_id: TKT-0056
status: ready
---

# TKT-0056: スケジュール献立カードの開始導線と削除確認

## Summary

スケジュール画面の献立カード内にあった「開始」ボタンを削除し、カードクリックで開く操作メニューに「調理を開始」を追加した。単体削除は即時削除ではなく、献立名を表示する確認モーダルを経由するようにした。

## Changes

- `renderSchedule()` の献立カードから右端の開始ボタンを削除。
- `scheduleSlotMenu` に「調理を開始」を追加し、選択中献立の `recipeId` で `openCookingViewer(recipeId, { returnTo: 'schedule' })` を呼ぶようにした。
- `scheduleSlotDeleteModal` を追加し、`removeScheduleSlot()` は確認モーダル表示、`confirmScheduleSlotDelete()` は既存の `queueScheduleDelete()` 経由で未同期削除を積む構造に変更。
- GAS、Spreadsheet スキーマ、`state.pendingSync` 構造、`syncPendingChanges()` は変更なし。

## Verify

- HTML parse / `executeGAS` / `GAS_URL`: PASS
- `alert(` / `confirm(` / `prompt(`: 0件
- `showToast`: 存在確認済み
- 新規の個別 `executeGAS(payload...)` 書き込み: 追加なし

## Manual Smoke Notes

- スケジュール献立カード内の開始ボタンは削除済み。
- カードクリック時の操作メニューには「調理を開始」「別のレシピに変更」「削除する」が並ぶ。
- 削除操作はキャンセル可能な確認モーダルを挟み、確認後だけ未同期削除になる。
