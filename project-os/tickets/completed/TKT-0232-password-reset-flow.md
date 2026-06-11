---
id: TKT-0232-password-reset-flow
title: パスワードリセット（忘れた場合のメール再設定フロー）
status: completed
goal: パスワードを忘れたユーザーを運営者が Dashboard で手動救済する運用をなくす
acceptance:
  - ログイン画面に「パスワードを忘れた」導線があり、`/forgot-password` でメールアドレスを送信すると `resetPasswordForEmail`（redirectTo=/auth/confirm?next=/reset-password）が実行される
  - 送信後は成否に関わらず「メールを送信しました」系の同一文言を表示する（メールアドレスの存在有無を露出しない）
  - recovery メールのリンク → `/auth/confirm`（type='recovery'）→ `/reset-password` で新パスワード（確認入力つき）を `updateUser({ password })` で設定できる
  - 再設定後、新パスワードでログインできる（旧パスワードは無効）
  - `/forgot-password` は未ログインでアクセス可能、`/reset-password` は recovery セッションで動作する（routing.ts の公開パスと整合）
  - pending ユーザーがリセットしても承認ゲート（/pending 固定）は維持される
  - 新規ページのユニットテストが追加され、Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/app/forgot-password/
  - web/src/app/reset-password/
  - web/src/components/login-form.tsx
  - web/src/lib/auth/routing.ts
  - web/src/__tests__/
  - project-os/artifacts/TKT-0232/
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
  - artifacts/TKT-0232/verify.json
  - artifacts/TKT-0232/manual-smokes.md
  - artifacts/TKT-0232/review.md
  - artifacts/TKT-0232/report.md
owner_role: implementer
owner_notes:
  - 危険変更（auth_and_rls_policy）。manual-smokes.md / review.md 必須
  - パスワード最低長等は config（TKT-0149 設定値）に従い、フォーム側にも同じ制約のクライアント検証を置く
  - レート制限: Supabase 標準メールの制限に乗る。アプリ側での追加レート制限は本チケットでは実装しない（残リスクに記録）
---

# Summary

recovery フロー一式。メール送信起点 `/forgot-password` と再設定 `/reset-password` を新設する。
メールリンク処理は TKT-0229 で作った `/auth/confirm`（type='recovery' 対応済み）を共用する。

## 実装メモ

- フォームパターン参照: `web/src/components/login-form.tsx`（日本語エラー変換・isSubmitting・auth-form クラス）。
  signup フォーム（TKT-0229 成果物）のパスワード確認入力パターンを再利用
- `resetPasswordForEmail(email, { redirectTo: <origin>/auth/confirm?next=/reset-password })`
- `/reset-password` はメールリンク経由の recovery セッションが前提。セッションが無い場合は `/login` へ案内
- routing.ts の公開パス（TKT-0230 の4状態関数）に `/forgot-password` を追加。`/reset-password` は
  「ログイン済み（recoveryセッション含む）でも /pending へ飛ばさない」扱いが必要か実装時に確認し、テストで固定する
- テスト参照: `web/src/__tests__/login-form.test.tsx` / `auth-routing.test.ts`
- GAS/Spreadsheet/Drive 不使用。秘密鍵直書き禁止

## 非ゴール

- メールアドレス変更・MFA・ログイン通知
- 独自SMTP 設定（TKT-0233 に手順のみ）
- アプリ側レート制限（将来チケット）

## 依存チケット

- TKT-0229（/auth/confirm の recovery 対応を共用）
- TKT-0230（公開パスの4状態 routing と整合させる）

## 手動確認（manual-smokes の観点）

- 登録済みメールでリセット → メール → 新パスワード設定 → 旧で失敗・新で成功
- 未登録メールでも同一文言（存在有無の非露出）
- recovery リンクの再利用・期限切れで適切なエラー
- pending ユーザーのリセット後も /pending 固定のまま

## 残リスク

- リセット送信のアプリ側レート制限なし（Supabase 側制限のみ）。公開規模が広がる場合は別チケットで対応
