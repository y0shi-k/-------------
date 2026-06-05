---
id: SPEC-0071-schedule-dnd-sync-button-lock
title: スケジュールD&D移動の同期反映と同期ボタンロック
status: spec_ready
scope:
  - 献立スケジュール
  - 手動一括同期
  - 同期バーUI
constraints:
  - `献立スケジュール` シートの8列構造は変更しない
  - 新しい個別GAS通信や操作ごとの即時書き込みを追加しない
  - スプレッドシート書き込みは `state.pendingSync` + `syncPendingChanges()` に集約する
acceptance:
  - D&Dで別日・別食事区分へ移動した献立が、手動一括同期後も移動先に残る
  - 同ブロック内のD&D並び替えが、手動一括同期後も保持される
  - 同期中は上部の「同期する」ボタンがスピナー付きの「同期中」表示になり、再押下できない
  - 同期失敗時は未同期内容が保持され、同期ボタンが再操作可能に戻る
related_tickets:
  - TKT-0071-schedule-dnd-sync-button-lock
---

# Summary

D&D移動後の `pendingSync.scheduleUpdates` には新しい `date` / `meal` が入るが、一括同期GAS側が `status` と `sortOrder` だけを更新すると、同期後読み戻しでSpreadsheet上の旧日付・旧食事区分へ戻る。

`scheduleUpdates` の同期処理を既存8列スキーマへ揃え、同期中の二重押下をUIで防ぐ。

## 仕様

- `syncPendingChanges()` 内のGASペイロードで、`scheduleUpdates` のID一致行に `予定日`, `食事区分`, `レシピID`, `レシピ名`, `ステータス`, `表示順`, `最終編集日時` を反映する。
- 既存値を消さないため、更新payloadに空の項目がある場合はSpreadsheet上の既存値をフォールバックに使う。
- 料理完了時のステータス更新は、完全な schedule item payload を `scheduleUpdates` に積む。
- 同期開始から終了まで、上部同期ボタンは disabled / `aria-busy=true` / スピナー表示にする。

## 非対象

- Spreadsheetスキーマ変更
- GASデプロイ作業
- 操作ごとの即時GAS書き込み追加
