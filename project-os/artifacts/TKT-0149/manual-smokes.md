---
ticket_id: TKT-0149
status: passed
target_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
---

# TKT-0149 manual smokes

実行日時: 2026-06-01 21:39-21:45 JST

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| 未ログイン時の画面 | pass | `http://localhost:3002` でログイン画面を表示 |
| ログイン画面の基本表示 | pass | 入力欄とログインボタンが表示。ブラウザコンソールにエラーなし |
| 管理者作成ユーザーのログイン | pass | `web/scripts/login-smoke.mjs` で確認。メール・パスワードの実値は記録しない |
| ログイン後の通常画面起動 | pass | `web/scripts/login-smoke.mjs` でアプリ本文の起動を確認 |
| 写真表示の退行確認 | pass | `npm run test` の `cooking-history-board` / `inventory-board` が通過 |
| AI API routeの退行確認 | pass | `npm run test` の `scan-ingredients-route` / `recipe-meal-workspace` が通過 |
| セキュリティヘッダー設定 | pass | `web/next.config.ts` に対象ヘッダーを追加し、`npm run build` が通過 |

実行コマンド:

```bash
harness/bin/verify_web.sh TKT-0149
node scripts/login-smoke.mjs
```

## skipped_checks

- 外部Gemini APIの実呼び出しは未実施。理由は外部送信と課金を避けるため。
- 実端末カメラでの食材写真撮影は未実施。理由はこの環境では実端末カメラ操作がないため。
- 本番Supabase Dashboardの設定変更は未実施。理由はこのチケットでは手順をdocsに残す範囲のため。

## open_risks

- 本番Supabase DashboardのAuth設定は、ローカルの `supabase/config.toml` 変更だけでは反映されない可能性がある。
- CSPは初回導入のため保守的に設定している。独自Supabaseドメインや外部画像ドメインを追加した場合は、必要な接続先だけを追加する。
- 外部Gemini APIの実呼び出しは、公開前に必要に応じて本番相当環境で確認する。
