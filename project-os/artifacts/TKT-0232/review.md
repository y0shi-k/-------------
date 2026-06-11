---
ticket_id: TKT-0232-password-reset-flow
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0232-password-reset-flow
---

# Review Record

## checked_diff_paths

- web/src/app/forgot-password/page.tsx・web/src/components/forgot-password-form.tsx（新規）
- web/src/app/reset-password/page.tsx・web/src/components/reset-password-form.tsx（新規）
- web/src/lib/auth/routing.ts（forgotPasswordPath/resetPasswordPath 追加・pending 例外に /reset-password）
- web/src/components/login-form.tsx（「パスワードを忘れた方」リンク追加のみ）
- web/src/__tests__/forgot-password-form.test.tsx・reset-password-form.test.tsx（新規）、
  auth-routing.test.ts・login-form.test.tsx（追記）

## checked_artifacts

- project-os/artifacts/TKT-0232/verify.json（status=pass）
- project-os/artifacts/TKT-0232/manual-smokes.md（static_only・実メールE2Eは skipped に明記）
- project-os/specs/completed/SPEC-0228-production-auth-onboarding.md（「画面・ルート構成」と一致）

## subagent_usage

- 実装: impl-deep（Opus）。オーケストレーター（メインセッション）は委譲・監査のみ。
- レビュー: メインセッションが routing.ts 全文と状態×パス表を確認。

## findings

1. **[確認済み・重要]** 承認ゲートとの整合: pending/disabled の例外は `/reset-password`・`/pending`・
   `/auth/*` のみで、リセット後も未承認ユーザーのデータ画面遮断（/pending 固定）は不変。
   テストで全分岐固定済み。承認制の穴になっていない。
2. **[確認済み]** メールアドレス列挙攻撃対策: 未登録エラーを成功表示へ倒し文言完全一致。
   レート制限のみ別文言（攻撃者に存在有無を渡さない範囲）。
3. **[確認済み]** `/reset-password` を公開パスにしない設計（unauthenticated→/login）は、
   セッションなしで開いて updateUser が必ず失敗する無意味な画面を防ぐ妥当な判断。
4. **[確認済み]** redirectTo が TKT-0229 のサニタイズ済み `/auth/confirm` 経由＝オープンリダイレクト防御を再利用。
5. **[許容・低]** /login の error クエリ（auth_confirm_failed 等）の文言表示が未実装。機能・安全性に
   影響なし（リンク失効時に無言でログイン画面へ戻る UX のみ）。軽量UI改善として別途対応可。
6. **[指摘なし]** 今回はオーケストレーター修正なし。

## open_risks

- 実メールでの E2E（受信→リンク→再設定→新PWログイン）は hosted 適用後に消化（manual-smokes）。
- アプリ側レート制限なし（チケット非ゴール・Supabase 標準制限依存）。

## verdict

passed — SPEC-0228 どおり。承認ゲートの例外が最小（/reset-password のみ）であることを
テスト込みで確認。列挙攻撃対策・既存防御の再利用も妥当。
