---
ticket_id: TKT-0232-password-reset-flow
status: passed
execution_mode: static_only
target_evals:
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- auth_and_rls_policy（recovery フロー・承認ゲートの例外パス）

## executed_checks

実メール送信環境なしのため static_only で実施:

- 存在有無の非露出をテストで固定: 未登録メールでも成功と同一 status 表示・alert 非表示。
- redirectTo が `/auth/confirm?next=/reset-password` であることをテストで固定
  （TKT-0229 の next サニタイズ・same-origin 解決を通る経路）。
- reset フォーム: 不一致→updateUser 未呼出、成功→「変更しました」表示、エラー日本語化をテストで固定。
- routing: pending/disabled は `/reset-password` のみ素通しで他パス /pending 固定が不変、
  `/forgot-password` は unauthenticated 公開・pending では /pending、をテストで固定。
- `/reset-password` の unauthenticated 直叩き → /login（middleware＋page 二層）を机上トレース。
- 既存テスト全件 pass＝ログイン・signup・承認ゲートの回帰なし（テスト上）。

## skipped_checks

hosted 適用後（TKT-0233 ゲート）に実機で消化する:

- 登録済みメールでリセット → メール受信 → リンク → 新PW設定 → 旧PWで失敗・新PWでログイン成功
- 未登録メールでも画面表示が完全に同一であること（実環境での確認）
- recovery リンクの再利用・期限切れ → /login へ（エラー表示は現状なし＝既知の軽微UX）
- pending ユーザーのリセット完了後も /pending 固定が維持される
- スマホ幅（375px）で /forgot-password・/reset-password の表示崩れなし

## open_risks

- アプリ側レート制限なし（Supabase 標準制限依存）。
- /login の error クエリ文言未実装（機能影響なし・UX のみ）。
