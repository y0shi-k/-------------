---
ticket_id: TKT-0194-zero-inventory-archive-restore
status: passed
review_scope:
  - supabase migration
  - inventory board restore UI
  - cooking consumption zero archive
  - RLS/self-user policy
---

# TKT-0194 review

## checked_diff_paths

- `supabase/migrations/20260606120000_zero_inventory_archive_restore.sql`
- `web/src/app/page.tsx`
- `web/src/lib/inventory/types.ts`
- `web/src/components/inventory-board.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `web/src/app/globals.css`

## checked_artifacts

- `project-os/artifacts/TKT-0194-zero-inventory-archive-restore/verify.json`
- `project-os/artifacts/TKT-0194-zero-inventory-archive-restore/manual-smokes.md`

## findings

- 重大な指摘なし。
- 0在庫は `inventory_items.archived_at` を設定して通常一覧から除外する。物理削除を即時には行わない。
- 復元は同じ `inventory_items.id` の `quantity` を0より大きい値にし、`archived_at` / `archived_reason` をnullへ戻す。
- RLSは既存の `inventory_items_select_own` / `insert_own` / `update_own` / `delete_own` によって本人データへ制限される。
- APIキーや秘密鍵の直書きは追加していない。

## open_risks

- 50件超過時の古いアーカイブ行はDB triggerで削除される。`cooking_consumption_events` は既存FKの `on delete set null` により、古い履歴の在庫ID参照がnullになる可能性がある。
- verify中に既存のESLint warningが3件出ているが、エラーではなく今回の完了判定はpass。

## verdict

passed
