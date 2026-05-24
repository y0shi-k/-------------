# TKT-0117 Report

## 実装内容

- 在庫/登録待ちに `unit_conversion` を保存するSupabase migrationを追加した。
- Web版の在庫型とフォーム値に単位換算項目を追加した。
- 在庫/登録待ちフォームに「単位換算」入力欄を追加した。
- 不完全な換算設定は保存前にエラー表示するようにした。
- 一覧カードに換算バッジを表示するようにした。
- AI写真解析の登録待ち作成は、換算なしとして `unit_conversion: null` を入れるようにした。

## 変更ファイル

- `supabase/migrations/20260524173000_unit_conversion.sql`
- `web/src/lib/inventory/types.ts`
- `web/src/components/inventory-board.tsx`
- `web/src/app/globals.css`
- `web/src/lib/ai/ingredient-scan.ts`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `project-os/knowledge/canvas-parity-matrix.md`
- `project-os/tickets/TKT-0117-unit-conversion-web.md`
- `project-os/artifacts/TKT-0117/`

## verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
