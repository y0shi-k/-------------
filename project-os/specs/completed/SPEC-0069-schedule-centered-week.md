---
id: SPEC-0069-schedule-centered-week
title: スケジュール今日中心7日表示
status: spec_ready
scope:
  - Mode B スケジュールの7日表示範囲
  - スケジュール週ナビの中央ボタン
  - スケジュール日付カードの今日・土日表示
constraints:
  - Spreadsheet スキーマは変更しない
  - GAS通信、同期payload、state.pendingSync の構造は変更しない
  - syncPendingChanges() 以外の書き込み系 executeGAS(payload...) を追加しない
  - 献立カード、選択、ドラッグ、追加、削除の既存導線は維持する
acceptance:
  - scheduleWeekOffset が 0 のとき、今日を中央にした 今日-3日 から 今日+3日 の7日が表示される
  - 前の週 / 次の週で表示範囲が7日ずつ移動し、中央日も7日単位で移動する
  - 中央の今週ボタンを押すと scheduleWeekOffset が 0 に戻り、今日中心の7日表示になる
  - レシピ詳細からスケジュール追加後、追加した予定日を含む今日中心レンジへ移動する
  - 今日の日付カードが土日色より優先して強調される
  - 土曜日は青系、日曜日は赤系で表示される
  - verify がパスする
related_tickets:
  - TKT-0069-schedule-centered-week
---

# Summary

スケジュールの7日表示を曜日固定の週表示から、今日を中央に置く7日表示へ変更する。前後移動は7日単位のまま維持し、中央の今週表示は今日中心へ戻すボタンにする。

## 仕様

- `getWeekDates(offset)` は、今日 + `offset * 7` 日を中央日として、その3日前から3日後までの7日を返す。
- 日付文字列はローカル日付から `YYYY-MM-DD` を組み立て、UTC変換に依存しない。
- `getScheduleWeekOffsetForDate(dateStr)` は、指定日が含まれる今日中心レンジの offset を返す。
- 日付カードは今日を最優先で強調し、今日以外の日曜を赤系、土曜を青系にする。

## 非対象

- Spreadsheet / GAS のデータ構造
- スケジュールの追加・移動・削除・一括同期処理
- レシピ一覧、買い物リスト、料理ビューアの挙動
