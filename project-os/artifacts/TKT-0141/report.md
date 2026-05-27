# TKT-0141 Web版 食材追加フロー整理

## Summary

- Web版の食材追加を、登録待ちを挟まず `inventory_items` に直接保存する流れへ変更した。
- 右上の `+` から「画像スキャン」「手動で追加」を選ぶモーダルを追加した。
- 写真解析APIはDB保存せず候補だけ返し、画面で確認した候補だけ在庫へ保存するようにした。
- 既存の `staging_items` テーブルは削除していない。

## Verification

- `cd web && npm run lint`
- `cd web && npm run typecheck`
- `cd web && npm run test`
- `cd web && npm run build`

All commands passed.
