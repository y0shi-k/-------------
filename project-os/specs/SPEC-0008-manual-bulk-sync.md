# SPEC-0008-manual-bulk-sync.md

---
id: SPEC-0008
title: スプレッドシート手動一括同期
status: ready
acceptance:
  - 初期読込以外のスプレッドシート変更操作は即時通信しない
  - 在庫、レシピ、買い物処理の変更が未同期状態として画面に表示される
  - ユーザーが同期ボタンを押すと保留変更が1回の `executeGAS()` で反映される
  - 同期成功後はGASから返った最新一覧で画面状態を置き換える
  - 同期失敗時は保留変更が残り、再同期できる
  - Google Spreadsheet の既存スキーマは変更しない
related_tickets:
  - TKT-0008-manual-bulk-sync
---

## Summary

スプレッドシートへの変更通信を手動一括同期に変更する。初期読込と承認処理は現状通り即時通信し、在庫・レシピ・買い物リストの変更は `state.pendingSync` に積んでUIへ未同期状態を表示する。

## 仕様

- `state.pendingSync` に在庫新規、在庫更新、在庫削除、レシピ新規、レシピ更新、レシピ削除、買い物購入処理を保持する。
- UI操作時は `state.inventory`, `state.recipes`, `state.shopping` に楽観反映し、スプレッドシート通信は行わない。
- 「未同期 N 件」「同期する」「保留を破棄」を表示し、同期は `syncPendingChanges()` から1回だけ `executeGAS()` を呼ぶ。
- 同期成功後はGAS側で既存5シートから最新データを読み直して返し、フロントの状態を置き換える。
- 保留破棄は未同期キューを消し、最後に同期済みだったスナップショットへ戻す。

## 非対象

- `executeGAS()` の通信方式変更
- Google Spreadsheet のカラム追加、削除、リネーム、順序変更
- Gemini API 通信の一括化
