---
ticket_id: TKT-0031-persistent-activity-statusbar
status: passed
execution_mode: static_only
target_evals:
  - ui_component_update
  - gas_pattern_change
  - manual_bulk_sync_policy
---

# Manual Smokes

## target_evals

- 常設ステータスバー領域
- 手動一括同期の非ブロッキング化
- 二重同期防止

## executed_checks

- [x] `#activityStatusBar` が `bottom-0` の固定1行領域になり、`hidden` による出し入れをしないことを確認
- [x] `#bottomNav` がステータスバー高さ分だけ上に固定され、処理開始/終了時に位置を切り替えないことを確認
- [x] `main#app` の下余白がボトムナビ + ステータスバー分を固定確保することを確認
- [x] `syncPendingChanges()` が `{ nonBlocking: true }` で `executeGAS()` を呼ぶことを確認
- [x] `executeGAS()` の `nonBlocking` 時は `setStatus(true)` を呼ばず、全画面オーバーレイと一括disabledが発生しないことを確認
- [x] `state.isSyncing` により手動同期中の再同期がトースト通知で止まることを確認

## skipped_checks

- [ ] Canvas実機でのsafe-area、ボトムナビ、最下部ステータスバーの見た目確認
- [ ] 実GAS通信中の操作継続確認

## open_risks

- 実機のsafe-area量やCanvas外枠により、最下部の見え方は追加調整が必要になる可能性がある。
