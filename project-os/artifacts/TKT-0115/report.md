# TKT-0115 Report

## 実装内容

- 在庫一覧に保存場所、種別、期限有無、並び順の絞り込みを追加した。
- 在庫カードに `使い切り` 操作を追加した。
- 登録待ち/在庫にチェック選択を追加した。
- 登録待ちの選択一括削除を追加した。
- 在庫絞り込み、使い切り、一括削除のテストを追加した。

## 変更ファイル

- `web/src/components/inventory-board.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/inventory-board.test.tsx`
- `project-os/artifacts/TKT-0115/`

## verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
