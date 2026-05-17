# TKT-0053 実装レポート

## 変更内容

- スケジュール選択モードで1件以上選択した時、上部右側に小型の「選択削除」ボタンを表示。
- スケジュール下部に挿入していた大きな「チェックした献立を一括削除」ボタンを削除。
- 削除処理は既存の `batchDeleteSchedule()` を再利用。

## 同期・GAS

- GAS通信、Spreadsheetスキーマ、`state.pendingSync` 構造は変更なし。
- 完了済み献立を含む場合の既存確認モーダル挙動も維持。

## Verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

Result: `VERIFY_PASSED`
