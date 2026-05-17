---
id: SPEC-0053-schedule-bulk-delete-placement
title: スケジュール一括削除ボタンの上部配置
status: ready
scope:
  - app.html のスケジュール選択モードUI
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - `state.pendingSync` 構造変更なし
  - 一括削除処理は既存の `batchDeleteSchedule()` を再利用する
acceptance:
  - スケジュール選択モードで1件以上選択すると、上部右側に小型の「選択削除」ボタンが表示される
  - スケジュール下部の大きな一括削除ボタンは表示されない
  - 未選択時は上部の削除ボタンが表示されない
  - 既存の完了済み献立削除確認モーダル挙動は維持される
  - verify が PASS すること
related_tickets:
  - TKT-0053-schedule-bulk-delete-placement
---

# Summary

食材管理・買い物リストの一括操作と同じ方針で、スケジュール画面の下部一括削除ボタンを上部の小型ボタンへ移動する。削除処理本体は変更しない。
