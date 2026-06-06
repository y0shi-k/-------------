---
ticket_id: TKT-0194-zero-inventory-archive-restore
status: passed
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
---

# TKT-0194 manual smoke

実施日時: 2026-06-07

## executed_checks

- 手動数量マイナスで0になった在庫が通常一覧から消え、復元履歴に移ることを自動テストで確認した。
- 復元履歴から数量を指定して通常在庫へ戻せることを自動テストで確認した。
- 調理完了の在庫減算で0になった場合に `archived_reason = cooking_zero` が保存されることを自動テストで確認した。
- PC幅 1280px で復元履歴パネルが表示され、横はみ出しがないことをBrowserで確認した。
- スマホ幅 390px で復元履歴パネルが表示され、横はみ出しがないことをBrowserで確認した。
- RLSは既存の `inventory_items_*_own` policyを使うため、履歴行も本人の `user_id` のみ読み書き可能であることをmigration設計で確認した。

## skipped_checks

- Supabase本番DBへのmigration適用は行っていない。
- 別ユーザーアカウントを使った実DB上のRLS手動確認は行っていない。

## open_risks

- 50件超過時の古いアーカイブ行はDB triggerで削除される。古い調理消費イベントの `stock_item_id` は既存FKによりnullになる可能性がある。
