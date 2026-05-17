# TKT-0051 実装レポート

## 変更内容

- レシピ詳細モーダルの「スケジュール追加」をヘッダー右側の X ボタン横へ移動。
- レシピ詳細モーダル下部から「スケジュールに追加」ボタンを削除し、「閉じる」「編集する」を維持。
- 食材管理・買い物リストの下部一括操作ボタンを非表示化し、選択時だけ上部の小型ボタンを表示。
- 在庫は「選択削除」、買い物リストは「購入済み」「選択削除」を既存関数へ接続。

## 同期・GAS

- GAS通信、Spreadsheetスキーマ、`state.pendingSync` 構造は変更なし。
- 一括操作は既存の `batchDeleteInventory()` / `bulkPurchase()` / `bulkDeleteShopping()` を再利用。
- 新規の個別 `executeGAS(payload...)` 書き込みは追加していない。

## Verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

Result: `VERIFY_PASSED`

## 手動確認メモ

- Canvas実機での狭幅表示、チェック時の上部ボタン表示、レシピ詳細ヘッダー位置は最終目視確認対象。
