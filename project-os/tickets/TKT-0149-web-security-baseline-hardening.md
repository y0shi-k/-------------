---
id: TKT-0149-web-security-baseline-hardening
title: Web公開前の認証・登録・セキュリティヘッダー基礎強化
status: ready
goal: 他ユーザーへ公開する前に、短いパスワード、自由登録、ブラウザ側防御不足によるリスクを下げる
acceptance:
  - `supabase/config.toml` のメール/パスワードAuth設定が公開前基準に更新されている
  - 初期公開時の新規登録方針が、設定とdocsの両方で明確になっている
  - `web/next.config.ts` にセキュリティヘッダーが追加されている
  - セキュリティヘッダー追加後も、ログイン、通常画面、写真表示、AI API呼び出しが壊れていない
  - 本番Supabase/Vercelで手動設定が必要な項目がdocsに残っている
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - supabase/config.toml
  - web/next.config.ts
  - docs/runbook/
  - project-os/artifacts/TKT-0149/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0149-web-security-baseline-hardening
related_artifacts:
  - artifacts/TKT-0149/verify.json
  - artifacts/TKT-0149/manual-smokes.md
  - artifacts/TKT-0149/review.md
  - artifacts/TKT-0149/report.md
owner_role: implementer
owner_notes:
  - 危険変更（auth_and_rls_policy）。RLS自体は作り直さないが、Auth設定と公開前運用に関わるため manual-smokes.md / review.md を必須にする
  - 変更は小さく分ける。まず `supabase/config.toml` と `web/next.config.ts`、必要最小限のdocsだけを対象にする
  - 本番Supabase/Vercelの設定変更はこのチケットのコード実装では実施しない。必要な手順だけdocsへ残す
  - APIキーや秘密鍵の実値をdocs、ticket、spec、コードに書かない
---

# Summary

公開前の安全性を上げるため、パスワード強度、新規登録制御、セキュリティヘッダーを整える。

## 実装メモ

- `supabase/config.toml`
  - `minimum_password_length` を 8 以上へ変更。
  - `password_requirements` をSupabase CLIで有効な値へ変更。
  - 初期公開でsignupを閉じるか、少なくともdocsで本番設定方針を明記する。
- `web/next.config.ts`
  - `headers()` を追加し、基本的なセキュリティヘッダーを返す。
  - CSPはSupabase、Next.js、署名付き画像URLの動作を壊さない範囲から始める。
- `docs/runbook/`
  - Supabase Dashboard側でのパスワード強度、新規登録、メール確認、CAPTCHA検討の手順を追記。
  - Vercelの環境変数とSensitive設定の注意を必要に応じて追記。

## 手動確認

- ログイン済みユーザーが通常画面へ入れる。
- 未ログインユーザーが `/login` に送られる。
- 写真付き料理履歴が表示できる。
- AI API routeがCSPやヘッダーで壊れていない。
- スマホ幅でログイン画面と主要画面が崩れていない。

## 残リスク

- Supabase本番DashboardのAuth設定は、ローカルファイルだけでは反映されない可能性がある。公開前にユーザーがDashboard側で確認する必要がある。
- CSPは強化しすぎると画面や画像表示を壊すため、初回は保守的に導入する。
