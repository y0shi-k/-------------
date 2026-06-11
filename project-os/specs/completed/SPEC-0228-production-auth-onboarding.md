---
id: SPEC-0228-production-auth-onboarding
title: ログイン本番化（新規登録申請＋管理者承認＋パスワードリセット）
status: draft
scope:
  - 認証まわり全般（サインアップ申請 / 承認ゲート / 管理者画面 / パスワードリセット）
  - supabase/migrations/（profiles テーブル新設）と supabase/config.toml のローカルAuth設定
  - web/src/app/（/signup /auth/confirm /pending /admin /forgot-password /reset-password）
  - web/src/lib/auth/ と web/src/lib/supabase/middleware.ts
  - docs/runbook/（本番適用手順）
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - GAS/Spreadsheet/Drive を使わない。Next.js + Supabase + Vercel で完結する
  - APIキー・service role key をコード/クライアントに直書きしない。**service role key は今回 web/ に持ち込まない**（管理操作は RLS admin ポリシーで行う）
  - 既存テーブルの RLS（`auth.uid() = user_id`）は変更しない
  - 既存テストユーザーのログインを壊さない（profiles backfill で approved にする）
acceptance:
  - 未知のユーザーが /signup から登録申請でき、メール確認後も承認されるまでアプリ本体（在庫・レシピ等）に入れない
  - admin ロールのユーザーがアプリ内の管理画面で申請を承認/拒否でき、承認されたユーザーは次のアクセスから利用できる
  - 非adminユーザーは管理画面に入れず、他ユーザーの profiles 行を読み書きできない（RLSで遮断）
  - パスワードを忘れたユーザーがメール経由で自力再設定できる
  - 本番 Supabase/Vercel への適用手順（Dashboard設定・migration・初代admin作成）が runbook に揃っている
related_tickets:
  - TKT-0228-auth-profiles-foundation
  - TKT-0229-signup-request-flow
  - TKT-0230-approval-gate-routing
  - TKT-0231-admin-user-management
  - TKT-0232-password-reset-flow
  - TKT-0233-production-auth-runbook
---

# Summary

テスト用「ダッシュボード手動作成ユーザーのみ」の認証を、本番運用できる形へ拡張する。
方式はユーザー確定済み: **申請＋管理者承認 / アプリ内管理画面 / パスワードリセット込み / メールは当面 Supabase 標準**。

## 背景

- 現状は `signInWithPassword` のみ（`web/src/components/login-form.tsx`）。新規登録UI・承認・リセット導線なし。
- middleware は「未ログイン→/login」のみ（`web/src/lib/auth/routing.ts`）。ユーザーの承認状態という概念が存在しない。
- データ分離は全テーブル `auth.uid() = user_id` RLS で完成済み。足りないのは「誰を入れるか」の制御。
- TKT-0149 でパスワード強度・セキュリティヘッダー・signup方針docsは整備済み。

## 仕様（コア設計・全チケット共通の正本）

### profiles テーブル（TKT-0228）

- `public.profiles`: `id uuid primary key references auth.users(id) on delete cascade`、
  `email text not null`（auth.users から trigger でコピー。管理画面表示用）、
  `status text not null default 'pending' check (status in ('pending','approved','disabled'))`、
  `role text not null default 'member' check (role in ('member','admin'))`、
  `approved_at timestamptz` / `approved_by uuid references auth.users(id)`、`created_at` / `updated_at`。
- `auth.users` への AFTER INSERT トリガー（security definer 関数）で profiles 行を自動作成。
- **backfill**: migration 内で既存 auth.users 全員分の profiles を `status='approved', role='member'` で作成
  （既存テストユーザーを締め出さない）。初代 admin は runbook の SQL で昇格（migration に個人メールを書かない）。
- RLS: 有効化。本人は自分の行を select のみ可。admin は `public.is_admin()`（security definer・
  profiles.role='admin' 判定。definer で RLS 再帰を回避）経由で全行 select/update 可。
  insert/delete はクライアントから不可（トリガーのみ）。

### 承認の書き込み経路（決定）

**RLS admin ポリシーでクライアントから直接 update する**。service role key を web/ サーバーへ
持ち込まない（漏えい面の最小化）。auth.users の削除など admin API が必要な操作は**非対象**
（拒否= `status='disabled'`。ユーザー削除は将来必要なら Dashboard で実施）。

### 承認状態の判定位置（決定）

middleware（`updateSession`）で `getUser()` 成功後に profiles.status を1クエリ参照し、
`getAuthRedirectPath(pathname, authState)` を「未ログイン / pending / disabled / approved」の
4状態対応に拡張する。pending/disabled は `/pending`（状態表示＋ログアウトのみの画面）へ。
JWT claim 化やキャッシュは少人数運用では不要と判断（残リスク参照）。

### 画面・ルート構成

- `/signup`: メール＋パスワード（確認入力つき）で `supabase.auth.signUp`（`emailRedirectTo` → `/auth/confirm`）。
- `/auth/confirm`: route handler。`verifyOtp({ token_hash, type })` でメールリンクを処理し `next` へ遷移
  （signup確認・recovery 共用）。
- `/pending`: 承認待ち/利用停止の状態表示＋ログアウト。承認状態の問い合わせ先は表示しない（個人運用）。
- `/admin`: admin のみ。申請一覧（pending）と全ユーザー一覧、承認/拒否/無効化ボタン。非adminは `/` へ redirect。
- `/forgot-password` → recovery メール → `/reset-password`（`updateUser({ password })`）。
- ログイン画面に「新規登録」「パスワードを忘れた」リンクを追加。

### supabase/config.toml（ローカル練習場）

`[auth.email] enable_confirmations = true` 等、上記フローがローカルで再現できる設定に更新。
本番は Dashboard 管理（TKT-0233 runbook）。

## 非対象

- ソーシャルログイン / passkey / MFA / CAPTCHA
- ユーザー削除・メールアドレス変更・退会フロー
- 独自SMTP の実設定（手順を runbook に残すのみ）
- 既存データテーブルの RLS 変更
- 招待制（承認制で運用。招待は将来検討）

## Acceptance Example

- pending ユーザーでログイン → `/pending` に固定され、在庫・レシピ等のデータ画面へ URL 直叩きでも入れない
- admin が `/admin` で承認 → 当該ユーザーが再アクセスで `/` に入れる
- 非admin が `/admin` へ直アクセス → `/` へ redirect。devtools から他人の profiles を select/update → RLS で 0 行/エラー
- `resetPasswordForEmail` → メールリンク → 新パスワードで再ログイン成功
- service role key が web/ のコード・環境変数参照に存在しない（`grep -r SERVICE_ROLE web/src` がヒットしない）
