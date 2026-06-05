---
id: SPEC-0073-schedule-day-shift-controls
title: スケジュール7日表示の日送り操作
status: spec_ready
scope:
  - Mode B スケジュールの7日表示範囲
  - 7日リスト上下の日送りボタン
  - 前の週 / 次の週 / 今週ボタンの日送り後挙動
constraints:
  - Spreadsheet スキーマは変更しない
  - GAS通信、同期payload、state.pendingSync の構造は変更しない
  - syncPendingChanges() 以外の書き込み系 executeGAS(payload...) を追加しない
  - 献立カード、選択、ドラッグ、追加、削除の既存導線は維持する
acceptance:
  - 初期表示は今日を中央にした 今日-3日 から 今日+3日 の7日分である
  - 7日リスト上の上矢印で表示範囲が1日過去へ戻る
  - 7日リスト下の下矢印で表示範囲が1日未来へ進む
  - 日送り後の前の週 / 次の週は、現在の表示位置から7日単位で移動する
  - 今週ボタンで今日中心の7日表示へ戻る
  - レシピ詳細からスケジュール追加後、追加した予定日を含む7日表示へ移動する
  - 選択モード、選択削除、D&D、スケジュール追加ボタンの既存挙動が維持される
  - verify がパスする
related_tickets:
  - TKT-0073-schedule-day-shift-controls
---

# Summary

スケジュールの今日中心7日表示に、1日単位で表示範囲を前後へずらす操作を追加する。週移動は日送り済みの現在位置を基準に7日単位で移動する。

## 仕様

- `state.scheduleDayOffset` を、今日中心表示からの中央日オフセット日数として持つ。
- `getWeekDates()` は、今日 + `scheduleDayOffset` 日を中央日として、その3日前から3日後までの7日を返す。
- 上矢印は `scheduleDayOffset` を `-1`、下矢印は `+1` する。
- 前の週 / 次の週は `scheduleDayOffset` を `-7` / `+7` する。
- 今週ボタンは `scheduleDayOffset` を `0` に戻す。

## 非対象

- Spreadsheet / GAS のデータ構造
- `pendingSync` と `syncPendingChanges()` の挙動
- スケジュールの追加・移動・削除・一括同期処理
