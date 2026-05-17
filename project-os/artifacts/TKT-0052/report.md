# TKT-0052 実装レポート

## 原因

レシピ詳細からの追加は `assignScheduleFromViewer()` で `state.schedule` と `pendingSync.scheduleCreates` へ追加できていたが、追加後にスケジュールタブへ戻らず、対象日を含む週への移動もしていなかった。

スケジュールの + ボタン経由はスケジュール画面上で実行されるため、既存の `renderRecipeMode()` だけで見えていた。

## 変更内容

- 追加日を含む週を計算する `getScheduleWeekOffsetForDate()` を追加。
- `assignScheduleFromViewer()` の追加完了後に、対象週へ移動して `currentBTab = 'schedule'` に設定し、`switchMode('B')` で再描画するよう修正。

## 同期・GAS

- GAS通信、Spreadsheetスキーマ、`state.pendingSync` 構造は変更なし。
- スプシ書き込みは既存の `queueScheduleCreate()` と手動一括同期経路を維持。

## Verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

Result: `VERIFY_PASSED`
