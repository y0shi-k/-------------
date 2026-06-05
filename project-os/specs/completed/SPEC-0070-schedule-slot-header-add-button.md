---
id: SPEC-0070-schedule-slot-header-add-button
title: スケジュール食事枠ヘッダー追加ボタン
status: spec_ready
scope:
  - Mode B スケジュールの朝・昼・晩スロット追加ボタン配置
constraints:
  - Spreadsheet スキーマは変更しない
  - GAS通信、同期payload、state.pendingSync の構造は変更しない
  - syncPendingChanges() 以外の書き込み系 executeGAS(payload...) を追加しない
  - 既存のドラッグ、選択、カード操作、完了表示、TKT-0069 の今日中心7日表示は維持する
acceptance:
  - 各スロット下部の横長 dashed 追加ボタンが表示されない
  - 朝・昼・晩のヘッダー行右側に小型の追加ボタンが表示される
  - 小型追加ボタンから既存のレシピ選択モーダルが開く
  - 空スロット、レシピありスロット、選択モードONでレイアウトが崩れない
  - verify がパスする
related_tickets:
  - TKT-0070-schedule-slot-header-add-button
---

# Summary

スケジュールの各食事枠で下部に表示していた大きな追加ボタンを廃止し、食事名ヘッダー行の右端に小型の追加ボタンを配置する。

## 仕様

- `renderSchedule()` の各食事スロットは、ヘッダー行に食事名と小型 `＋` ボタンを横並びで表示する。
- 小型 `＋` ボタンは既存の `openScheduleRecipePicker(date, meal)` を呼び出す。
- 空スロットの枠と最低高さは維持し、ドラッグ&ドロップ先として認識できる表示を残す。

## 非対象

- Spreadsheet / GAS のデータ構造
- スケジュール追加後の pendingSync 登録、一括同期処理
- レシピ選択モーダルの検索、並び替え、追加処理
