---
ticket_id: TKT-0031-persistent-activity-statusbar
status: ready
---

# Report

## 変更目的

TKT-0029の下部ステータスを浮いたカード表示から常設の最下部1行バーへ変更し、処理開始/終了時のレイアウトズレを防ぐ。あわせて、スプレッドシートへの手動一括同期中も画面操作できるようにした。

## 今回追加した安全装置

- `state.isSyncing` を追加し、手動同期の二重実行を防止
- `executeGAS()` に `nonBlocking` オプションを追加し、手動同期時は全画面オーバーレイと一括disabledを回避
- ステータスバー、ボトムナビ、メイン下余白を固定配置にして、状態表示によるズレを抑制

## 実施した確認

- 標準verify: passed
- `alert` / `confirm` / `prompt`: no matches
- `showToast`: exists
- `git diff --check`: passed
- 新規の個別Spreadsheet書き込み経路なし

## 残リスク

- Canvas実機でのsafe-areaと下部表示位置は未確認。

## 次の依頼や人判断

- Canvasプレビューで最下部ステータスバーとボトムナビの見え方を確認する。
