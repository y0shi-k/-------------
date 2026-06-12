---
ticket_id: TKT-0243-meal-workspace-inventory-store-migration
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

check-gates が検出した4 eval のうち、危険3件（supabase_schema_change / auth_and_rls_policy / photo_upload_storage）は diff 内のテーブル名・バケット名トークンによる**過剰マッチ**。`supabase/` 配下・RLS・auth・Storage 設定に実変更は無い（review.md で確認済み）。実質対象は web_project_bootstrap（非危険）のみ。

## executed_checks

- `git diff --stat supabase/` で schema/migration の差分ゼロを確認。
- 単体テストで調理完了→在庫減算→共有ストア反映を検証（Supabase クライアントモック、3件 pass）。
- 既存の献立・消費系テスト含む 557件全 pass（verify.json 参照）。
- 写真アップロード経路（completeSchedule 内の photos insert / Storage remove）はロジック無変更で、setState の filter 追加のみであることを diff で確認。

## skipped_checks

- 実機（ブラウザ）でのタブ切替スモーク: 静的確認とテストで代替。推奨手順は report.md の「次の依頼や人判断」に記載（調理完了→在庫一覧タブ切替で即時反映、完了取り消しで数量復元）。
- Supabase 本番環境での確認: schema/RLS 無変更のため不要。

## open_risks

- 実機未確認のため、タブ切替タイミング起因の表示遅延（quantity=0→復活 item の非同期リフェッチ、数百ms想定）は実運用で要観察。
