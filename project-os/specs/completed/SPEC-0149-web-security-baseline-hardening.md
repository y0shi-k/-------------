---
id: SPEC-0149-web-security-baseline-hardening
title: Web公開前の認証・登録・セキュリティヘッダー基礎強化
status: spec_ready
scope:
  - supabase/config.toml
  - web/next.config.ts
  - docs/runbook/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 既存のログイン導線と本人データ分離を壊さない
  - APIキー、Supabase秘密鍵、DBパスワードをコードへ直書きしない
  - 本番Supabase/Vercelの設定変更はユーザーの明示依頼がある場合だけ行う
acceptance:
  - ローカルSupabase設定でメール/パスワードの最低強度が公開前基準に上がっている
  - 新規登録の扱いが「初期公開は招待/管理者作成寄り」に整理され、設定と運用手順が矛盾しない
  - Next.jsのセキュリティヘッダーが追加され、通常画面、ログイン画面、写真表示、Supabase通信を壊さない
  - Vercel/Supabase本番側で手動設定が必要な項目がdocsに残っている
  - Web版verifyが通る
related_tickets:
  - TKT-0149-web-security-baseline-hardening
---

# Summary

他ユーザーへ公開する前に、Stock Master Web版の基礎的なセキュリティ設定を強化する。

対象は、パスワード強度、新規登録の制御、Next.jsセキュリティヘッダーの3点。RLSやStorage policyの作り直しは行わず、既存の本人分離を維持する。

## 背景

現状は個人利用・開発中なら大きな問題はない。ただし、他ユーザーに使ってもらう場合は、短いパスワード、誰でも登録できる状態、ブラウザ側防御ヘッダー不足がリスクになる。

## 仕様

- `supabase/config.toml` のAuth設定を公開前基準へ寄せる。
  - `minimum_password_length` は 8 以上にする。
  - `password_requirements` は少なくとも英字・数字を含む設定にする。実装時にSupabase CLIの対応値を確認し、ローカル起動で壊れない値を使う。
- 新規登録は初期公開では制限する方針にする。
  - ローカル設定では `enable_signup` の扱いを明示する。
  - 本番Supabase Dashboardでの設定手順をdocsへ残す。
  - 一般公開に戻す場合は、メール確認とCAPTCHAを検討項目として残す。
- `web/next.config.ts` にセキュリティヘッダーを追加する。
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Content-Security-Policy`
- CSPは最初から強くしすぎない。
  - Supabase通信、署名付き画像URL、Next.jsの通常動作を壊さない範囲で始める。
  - verifyとブラウザ確認で問題が出たら、必要な接続先だけを追加する。

## 非対象

- RLS policyの作り直し
- Supabase Storage bucketや写真保存仕様の変更
- Gemini APIのユーザーキー化（SPEC-0150で扱う）
- 本番Supabase/Vercelの実設定変更

## 実装時の注意

- Auth設定は危険変更として扱う。manual-smokesとreviewを残す。
- 本番のSupabase Auth設定は `supabase/config.toml` を編集するだけでは変わらない可能性があるため、必ずdocsにDashboard手順を残す。
- セキュリティヘッダー追加後、スマホ表示、ログイン、写真表示、AI機能の最低限の手動確認を行う。
