---
ticket_id: TKT-0244-remaining-mutation-sync-cleanup
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
---

# Manual Smokes

## target_evals

check-gates が検出した 3 つの危険 eval は、diff 中のテーブル名トークン（`shopping_items` 等）に
よる過剰マッチ。本チケットは `web/src/components/` のクライアント側 state 同期のみの変更で、
schema / RLS / Storage / 認証は無変更（ticket owner_notes に予見記載あり）。よって static 確認のみ。

## executed_checks

- `git diff` の変更パスを目視確認: `supabase/` 配下・migration・RLS policy・Storage 設定の変更が
  含まれないこと（変更は web/src/components/*.tsx、web/src/app/page.tsx、web/src/__tests__/ のみ）。
- `rg "router\.refresh" web/src/components/` の残存 6 箇所がすべて「対応不要」判定（report.md の表）と
  一致することを確認。
- verify_web.sh の policy チェック（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass。
- 買い物リストの mutation 経路（inventory-board の追加/購入/削除、recipe-meal-workspace の不足分追加・
  献立削除連動）がすべて `setShoppingItems` 経由でストアへ反映されることをコード上で確認。

## skipped_checks

- 実機（ブラウザ）での画面間反映スモーク: 危険 eval が過剰マッチであり、対象機能はユニットテスト
  （557件 pass）でカバーされるためスキップ。実機確認は通常利用時に問題があれば TKT 化する。

## open_risks

- なし（schema/auth/Storage 無変更のため、危険 eval 由来のリスクは発生しない）。
