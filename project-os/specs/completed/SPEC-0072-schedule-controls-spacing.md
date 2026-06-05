---
id: SPEC-0072-schedule-controls-spacing
title: スケジュール操作欄の余白圧縮
status: spec_ready
scope:
  - Mode B スケジュール画面の操作欄レイアウトと補助文言配置
constraints:
  - Spreadsheet スキーマは変更しない
  - GAS通信、同期payload、state.pendingSync の構造は変更しない
  - syncPendingChanges() 以外の書き込み系 executeGAS(payload...) を追加しない
  - 週移動、選択モード、選択削除、D&D、スケジュールカード操作は維持する
acceptance:
  - 選択モード行からスケジュール一覧までの不要な固定余白が削除される
  - スケジュール画面に「7日分」文言が表示されない
  - 「同期は上部の同期ボタンで一括反映」が選択モード行の右端に表示される
  - 選択モードOFF、選択モードON、1件以上選択時に操作欄が崩れない
  - verify がパスする
related_tickets:
  - TKT-0072-schedule-controls-spacing
---

# Summary

Mode B スケジュール画面で、選択モード操作欄下の固定高さと件数行を削除し、スケジュール一覧を上へ詰める。

## 仕様

- `renderRecipeModeControls()` のスケジュール分岐では、共通の `recipeSecondaryRow` / `recipeSelectRow` 固定高さを解除する。
- スケジュール画面では `recipeSelectRow` に件数行を出さず、「7日分」文言を表示しない。
- 同期説明文は選択モードボタンと同じ行の右側に配置する。
- 選択中件数と選択削除ボタンは既存条件で表示し、横幅不足時も行全体が崩れないようにする。

## 非対象

- Spreadsheet / GAS のデータ構造
- `pendingSync` と `syncPendingChanges()` の挙動
- スケジュールカード、D&D、レシピ選択モーダルの機能変更
