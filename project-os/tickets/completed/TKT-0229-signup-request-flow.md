---
id: TKT-0229-signup-request-flow
title: 新規登録申請フロー（/signup＋メール確認＋/auth/confirm）
status: completed
goal: 未知のユーザーがダッシュボード操作なしで自分で登録申請できるようにする（承認まで利用不可の前提で受け口を作る）
acceptance:
  - `/signup` でメール＋パスワード（確認入力つき・不一致はエラー表示）から `supabase.auth.signUp` が実行できる
  - signUp の `emailRedirectTo` が `/auth/confirm` を指し、確認メールのリンクで `verifyOtp({ token_hash, type })` が処理されて `next` パラメータ先へ遷移する
  - メール確認完了直後のユーザーは status='pending' であり、`/`（データ画面）へは入れない（TKT-0230 のゲートと結合して成立。単体では「profiles が pending で作成されている」ことを確認）
  - ログイン画面（`web/src/components/login-form.tsx`）に「新規登録」導線がある
  - `supabase/config.toml` の `[auth.email]` で `enable_confirmations = true` などローカルでフローが再現できる設定になっている
  - signup フォームのエラー文言が日本語で、既存 `getLoginErrorMessage` と同等のトーン（生のSupabaseエラーを露出しない）
  - 新規ページ/ルートのユニットテストが `web/src/__tests__/` に追加され、Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/app/signup/
  - web/src/app/auth/confirm/
  - web/src/components/
  - web/src/__tests__/
  - supabase/config.toml
  - project-os/artifacts/TKT-0229/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0228-production-auth-onboarding
related_artifacts:
  - artifacts/TKT-0229/verify.json
  - artifacts/TKT-0229/manual-smokes.md
  - artifacts/TKT-0229/review.md
  - artifacts/TKT-0229/report.md
owner_role: implementer
owner_notes:
  - 危険変更（auth_and_rls_policy）。manual-smokes.md / review.md 必須
  - パスワード最低長等は TKT-0149 で設定済みの config 値に従う（勝手に変えない）
  - APIキー・秘密鍵の直書き禁止。クライアントは anon key のみ（既存 `createBrowserSupabaseClient` を使う）
---

# Summary

サインアップ申請の受け口。`/signup` ページとメール確認リンクの処理ルート `/auth/confirm` を新設する。
profiles の pending 化は TKT-0228 のトリガーが担うため、このチケットは Auth フローと UI のみ。

## 実装メモ

- 既存パターンの参照:
  - フォーム/エラー処理: `web/src/components/login-form.tsx`（日本語エラー変換・isSubmitting・auth-form CSS クラス）
  - ページ構成: `web/src/app/login/page.tsx`
  - クライアント生成: `web/src/lib/supabase/browser.ts`（browser）、`web/src/lib/supabase/middleware.ts`（@supabase/ssr の使い方）
- `/auth/confirm` は route handler（`route.ts`）。`@supabase/ssr` の `createServerClient` で
  `verifyOtp({ type, token_hash })` → 成功時 `next`（既定 `/`）へ redirect、失敗時 `/login` へエラー付き redirect。
  type は `signup`（确认）と `recovery`（TKT-0232 が利用）を受ける汎用実装にする
- redirect 先 `next` はオープンリダイレクト防止のため相対パスのみ許可する
- `supabase/config.toml`: `[auth.email] enable_confirmations = true` を追加。`site_url` / `additional_redirect_urls` に
  `/auth/confirm` が通ることを確認。既存コメント（ローカル専用の注記）は温存
- ルーティング: `/signup` と `/auth/confirm` は未ログインでアクセス可能にする必要がある。
  `web/src/lib/auth/routing.ts` の `getAuthRedirectPath` が「login 以外は全部 /login へ」なので、
  公開パスの追加が必要（TKT-0230 で4状態拡張するため、ここでは公開パス配列の追加など最小変更に留め、衝突しないよう実装順は 0230 と調整）
- テスト参照: `web/src/__tests__/login-form.test.tsx` / `auth-routing.test.ts`
- GAS/Spreadsheet/Drive 不使用

## 非ゴール

- pending/disabled の遮断とリダイレクト（TKT-0230）
- 承認UI（TKT-0231）
- recovery メールの起点UI（TKT-0232。`/auth/confirm` の type='recovery' 対応だけ本チケットで入れる）
- 本番 Dashboard の signup 有効化（TKT-0233）

## 依存チケット

- TKT-0228（profiles 自動作成トリガー。これが無いと登録後の状態が表現できない）

## 手動確認（manual-smokes の観点）

- /signup → 確認メール（ローカルは Inbucket/Mailpit）→ リンク → ログイン状態になり profiles=pending
- パスワード不一致・既存メールで適切な日本語エラー
- メール未確認のままログイン試行 → 確認を促すエラー

## 残リスク

- Supabase 標準メールのレート制限（本番は時間あたり数通）。少人数前提で許容し、SMTP移行手順は TKT-0233 に残す
