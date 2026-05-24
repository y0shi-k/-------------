# TKT-0118 Report

## 実装内容

- 買い物リストに手動追加フォームを追加した。
- 未購入/購入済みセクションを分けた。
- 未購入アイテムを購入済みに更新できるようにした。
- チェックした買い物を一括削除できるようにした。
- 献立由来/手動追加の出自表示を追加した。
- 買い物操作のテストを追加した。

## 変更ファイル

- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `project-os/knowledge/canvas-parity-matrix.md`
- `project-os/tickets/TKT-0118-shopping-list-canvas-parity.md`
- `project-os/artifacts/TKT-0118/`

## verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
