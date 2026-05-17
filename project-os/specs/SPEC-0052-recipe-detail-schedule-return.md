---
id: SPEC-0052-recipe-detail-schedule-return
title: レシピ詳細からのスケジュール追加後表示修正
status: ready
scope:
  - app.html のレシピ詳細経由スケジュール追加フロー
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - `state.pendingSync` 構造変更なし
acceptance:
  - レシピ詳細からスケジュール追加後、追加した日付を含むスケジュール週が表示される
  - スケジュールの + ボタン経由の追加挙動は変わらない
  - スプシ書き込みは既存の pendingSync + 手動同期経路を維持する
  - verify が PASS すること
related_tickets:
  - TKT-0052-recipe-detail-schedule-return
---

# Summary

レシピ詳細からスケジュール追加した場合に、ローカル状態へは追加されているのに画面がスケジュール表示へ戻らず、追加されていないように見える問題を修正する。

## 仕様

- 詳細経由の追加完了後、追加日を含む週へ `scheduleWeekOffset` を合わせる。
- `currentBTab` を `schedule` にしてスケジュール画面を再描画する。
- 追加処理・同期キュー・GAS処理は変更しない。
