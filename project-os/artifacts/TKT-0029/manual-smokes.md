---
ticket_id: TKT-0029-background-activity-status
status: passed
target_evals:
  - ui_component_addition
  - gas_pattern_change
---

# executed_checks

- [x] 標準 verify が `VERIFY_PASSED` になることを確認
- [x] JavaScript構文チェックが `JS_PARSE_PASSED` になることを確認
- [x] `activityStatusBar` が画面下部に追加されていることを確認
- [x] `executeGAS` が処理開始・完了・失敗時に下部ステータスを更新することをコード上で確認
- [x] 写真未取得時のカード内表示がスピナー付きの「写真を取得中」になっていることを確認
- [x] `setSharing` / `ANYONE_WITH_LINK` を追加していないことを確認
- [x] `alert(` / `confirm(` / `prompt(` が存在しないことを確認

# skipped_checks

- Canvas実機での下部ステータス表示位置とボトムナビとの重なり確認は未実施
- 実GAS通信中の表示文言確認は未実施

# open_risks

- 下部ステータスは固定表示のため、端末サイズによっては一部コンテンツに重なる可能性がある。`bottom-20` でボトムナビ上に逃がしている。
