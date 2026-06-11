---
ticket_id: TKT-0233-production-auth-runbook
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
---

# Manual Smokes

## target_evals

- web_project_bootstrap（チケット front-matter の正本。docs のみの変更）
- ※ check-gates の diff 判定では auth/schema/photo/csv の危険 eval が表示されるが、これは
  作業ツリーに同居する TKT-0228〜0232 の未コミット変更への過剰マッチ。本チケットの実変更は
  `docs/runbook/認証本番化の適用手順.md`（新規）と `docs/runbook/Supabaseの反映と運用ガイド.md`
  （§12 参照1行追記）のみで、web/・supabase/ は無変更（静的記録）。

## executed_checks

- 本チケットの diff に web/・supabase/ が含まれないことを確認（docs 2ファイルのみ）。
- 手順書の参照先4ファイル（Supabaseの反映と運用ガイド.md §5/§10b/§7・公開前セキュリティ確認.md）の
  実在を確認。
- 秘密情報（APIキー・パスワード・個人メール・本番URL実値）が含まれないことを全文確認
  （verify policy no_hardcoded_secret も pass）。
- 手順書の E2E スモーク A〜J が TKT-0228〜0232 の manual-smokes skipped_checks を網羅していることを
  突合（pending遮断・AI 403・権限境界・PWリセット存在非露出・375px 含む）。

## skipped_checks

- 手順書に沿った実際の本番適用と E2E スモークの実施（ユーザー作業。本チケットの責務外）。

## open_risks

- 手順書は執筆時点の Supabase Dashboard UI 名称に依存（手順書の残リスク表に記載済み）。
