# Report: TKT-0074

## Summary

モードCを料理履歴一覧から料理記録ダッシュボードへ拡張した。カレンダー、タイムライン、振り返りの3ビューを追加し、既存の写真・評価・感想・もう一度作る導線を維持した。

## Changes

- モードC上部に今月/今週/写真あり率/よく作る料理のサマリーを追加。
- `カレンダー / タイムライン / 振り返り` のビュー切り替えを追加。
- カレンダーで記録日、写真あり、高評価、予定のみの日を判別できるようにした。
- タイムラインを日付グループ化し、検索、期間、評価、写真、ジャンル、献立枠フィルタを追加。
- 振り返りに頻出料理、高評価、しばらく作っていない料理、ジャンル傾向、今月の写真を追加。
- `mealType` と `tags` は保存せず、既存データから表示時に派生する方式にした。

## Verification

- `VERIFY_PASSED`
- `JS_PARSE_PASSED`
- native dialog scan passed.
- diff write-pattern scan passed.

## Notes

Spreadsheet schema and GAS write behavior were not changed. Canvas実表示確認はユーザー側の手動確認対象。
