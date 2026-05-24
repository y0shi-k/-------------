# TKT-0116 Report

## 実装内容

- 保存場所マスタ `storage_locations` のSupabase migrationを追加した。
- 保存場所追加UIを在庫画面へ追加した。
- 使用中の保存場所を削除できないようにした。
- 在庫/登録待ちフォームの保存場所入力に候補リストを追加した。
- 保存場所追加と使用中削除制御のテストを追加した。

## 変更ファイル

- `supabase/migrations/20260524161600_storage_locations.sql`
- `web/src/lib/inventory/types.ts`
- `web/src/app/page.tsx`
- `web/src/components/inventory-board.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/inventory-board.test.tsx`
- `project-os/artifacts/TKT-0116/`

## verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
