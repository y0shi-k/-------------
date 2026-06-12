---
ticket_id: TKT-0242-shared-inventory-store-foundation
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- web_project_bootstrap（実体）
- supabase_schema_change / auth_and_rls_policy / photo_upload_storage は `inventory_items` 等のトークンによる**過剰マッチ**。本チケットは Supabase schema / migration / RLS / auth / Storage を一切変更していない（クライアント側 state 構成のみ）。

## executed_checks

- `git diff` の全変更パスを確認し、`supabase/` 配下・migration・RLS policy・Storage 設定・auth 関連ファイルに変更がないことを確認した。
- `verify_web.sh` の policy チェック（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）が pass であることを確認した。
- jsdom テストで在庫一覧の既存操作（追加・編集・消費・アーカイブ・復元）28件 + ストア伝播2件が pass。

## skipped_checks

- 実機（ブラウザ/タブレット）での在庫操作スモーク: schema/auth/Storage 無変更のため static 確認で代替。実機確認は TKT-0243（発端不具合の解消チケット）完了時にまとめて行う方が効率的。

## open_risks

- なし（危険領域に対する実変更がないため）。クライアント側の置き換え漏れリスクは report.md の残リスク参照。
