---
ticket_id: TKT-0245-cross-board-sync-regression-tests
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- `web_project_bootstrap`（チケット指定の正本 eval）
- `supabase_schema_change` / `photo_upload_storage` … check-gates の自動判定で検出されたが、テスト内モックの文字列（テーブル名・「写真」関連語）への正規表現誤検知。対象実装差分なし（review.md 参照）。

## executed_checks

- `harness/bin/verify_web.sh TKT-0245`: lint / typecheck / test / build すべて pass。新規テスト `cross-board-sync.test.tsx` が消費確定の実フロー（調理開始→料理完了→消費モーダル確定→ストア減算→別 Consumer 反映）を jsdom 上で検証し green。
- git diff の静的確認: `supabase/` 配下・schema・Storage・auth・production コードへの変更が無いことを確認。

## skipped_checks

- `web_auth_guard` / `web_storage_security` / `web_mobile_photo_capture`: 対象となる実装変更が存在しないためスキップ（テストのみの変更。auth・Storage・写真取り込みの挙動は不変）。
- ローカル Supabase + Playwright の E2E スモーク（acceptance で任意）: production 挙動が変わらないため未実施。手順は `project-os/knowledge/learnings.md` 2026-06-12 節に記録済み。

## open_risks

- 実機ブラウザでのタブ切替表示は jsdom と厳密には等価でない。実機で鮮度問題が再発した場合は learnings の E2E 手順で確認する。
