# TKT-0054 実装レポート

## 原因

レシピ詳細の「スケジュールに追加」モーダルだけ、夕食ボタンが `assignScheduleFromViewer('夜')` を渡していた。

一方、スケジュール画面の表示枠は `朝` / `昼` / `晩` で描画しており、日付件数は増えるが `夜` の献立は `晩` 枠に一致せず表示されなかった。

## 変更内容

- 詳細モーダルの夕食ボタンを `晩` に変更。
- `normalizeScheduleMeal()` を追加し、既存の `夜` データも `晩` として扱う。
- スケジュール表示、日別サマリー、追加重複判定、削除/更新、ドラッグ移動で食事区分を正規化して比較。

## 同期・GAS

- GAS通信、Spreadsheetスキーマ、`state.pendingSync` 構造は変更なし。
- 新規追加は `cleanScheduleItem()` 経由で `晩` として pendingSync に積まれる。

## Verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

Result: `VERIFY_PASSED`
