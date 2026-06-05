---
id: SPEC-0049-cooking-viewer-return-route
title: 料理ビューアの戻り先保持
status: spec_ready
scope:
  - 料理ビューア
  - レシピ集からの料理開始導線
  - スケジュールからの料理開始導線
constraints:
  - Spreadsheetスキーマ、GAS通信、pendingSyncは変更しない
  - 料理完了時の消費量調整ロジックは変更しない
  - 戻り先はクライアントUI状態として保持し、Spreadsheetへ保存しない
acceptance:
  - スケジュール画面の献立カードから料理ビューアを開き、戻るボタンでスケジュール画面に戻る
  - レシピ集の料理ボタンから料理ビューアを開き、戻るボタンでレシピ集に戻る
  - 料理履歴などモードC内から料理ビューアを開いた場合は、戻るボタンで料理履歴表示に戻る
  - 新規の個別GAS通信やSpreadsheet書き込みを追加しない
related_tickets:
  - TKT-0049-cooking-viewer-return-route
---

# Summary

料理ビューアは複数の画面から起動されるが、従来は戻るボタンで常にモードCの通常表示へ戻っていた。起動元の画面を保持し、戻るボタンで直前の導線に戻す。

## 仕様

- `openCookingViewer()` は戻り先情報を受け取れる。
- スケジュール画面から開く場合は `mode=B`, `bTab=schedule` を戻り先にする。
- レシピ集から開く場合は `mode=B`, `bTab=recipes` を戻り先にする。
- 戻り先指定がない場合は、ビューア起動直前の `state.currentMode`, `state.currentBTab`, `state.currentCTab` を保存する。
- `closeCookingViewer()` は保存された戻り先に応じて既存の `switchMode()` / `renderRecipeMode()` / `renderCookingMode()` を使って復帰する。

## 非対象

- ビューアの材料・手順UI変更
- 料理完了時の同期キュー変更
- Spreadsheet/GASの変更
