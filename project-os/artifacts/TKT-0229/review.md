---
ticket_id: TKT-0229-signup-request-flow
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0229-signup-request-flow
---

# Review Record

## checked_diff_paths

- web/src/app/signup/page.tsx（新規。ログイン済みは `/` へ redirect、サーバー側 getUser）
- web/src/components/signup-form.tsx（新規。確認入力・日本語エラー変換・成功表示切替）
- web/src/app/auth/confirm/route.ts（新規。verifyOtp + next サニタイズ + 失敗時 /login へ）
- web/src/lib/auth/safe-next-path.ts（新規。オープンリダイレクト防止）
- web/src/lib/auth/routing.ts（isPublicPath 追加。2状態構造は維持＝TKT-0230 との境界どおり）
- web/src/components/login-form.tsx（「新規登録」リンク追加のみ）
- web/src/app/globals.css（form-success / auth-links / auth-confirmation 追加）
- supabase/config.toml（enable_confirmations=true・redirect URLs に /auth/confirm 追加・コメント温存）
- web/src/__tests__/（signup-form / safe-next-path 新規、auth-routing 追加）

## checked_artifacts

- project-os/artifacts/TKT-0229/verify.json（status=pass）
- project-os/artifacts/TKT-0229/manual-smokes.md（static_only・実メール確認は skipped に明記）
- project-os/specs/completed/SPEC-0228-production-auth-onboarding.md（「画面・ルート構成」との一致）

## subagent_usage

- 実装: impl-deep（Opus）。オーケストレーター（メインセッション）は委譲・監査・修正のみ。
- レビュー: メインセッションが route.ts / safe-next-path.ts / routing.ts / signup-form.tsx /
  page.tsx / config.toml diff を全文確認。

## findings

1. **[修正済み・中]** `/auth/confirm` の成功 redirect が `successUrl.pathname = nextPath` 代入だったため、
   クエリ付き `next`（例 `/reset-password?x=1`）で `?` がパーセントエンコードされ壊れる。
   → オーケストレーターが `new URL(nextPath, request.nextUrl.origin)` へ修正
   （sanitizeNextPath が先頭 `/`・`//` 拒否を保証するため same-origin は維持）。
2. **[確認済み]** オープンリダイレクト防止: 絶対URL・`javascript:`・`//host`・`/\host` をすべて既定 `/` へ
   フォールバック。テストで固定済み。
3. **[確認済み]** verifyOtp の type 許可リスト（signup/email/recovery）。recovery は TKT-0232 の前倒し対応で、
   起点UIなしでもセキュリティ上の追加露出はない（token_hash 必須のため）。
4. **[確認済み]** 生エラー非露出・anon key のみ・秘密直書きなし・GAS/Drive 依存なし・Canvas app.html 不変。
5. **[既知・許容]** pending ユーザーの本体侵入は TKT-0230 まで残存（チケット非ゴールどおり）。
   イニシアチブとして 0230 完了までデプロイしない前提を report に明記済み。

## open_risks

- 実メールフローは未検証（manual-smokes skipped_checks）。hosted 適用ゲート（TKT-0233）で消化する。
- 本番 Dashboard の Confirm email / Redirect URLs 設定漏れリスク → TKT-0233 runbook で手順化。

## verdict

passed — SPEC-0228 の設計どおり。境界（4状態化は 0230、recovery 起点UIは 0232）も守られており、
指摘1件は修正済み。危険変更（auth）として必要な防御（オープンリダイレクト防止・type 検証・
エラー非露出）を確認した。
