---
ticket_id: TKT-0229-signup-request-flow
status: passed
execution_mode: static_only
target_evals:
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- auth_and_rls_policy（signup・メール確認・公開パスのルーティング変更）

## executed_checks

実メール送信環境なし（ローカル Supabase 不在の既知制約）のため static_only で実施:

- ユニットテストで固定: パスワード不一致→signUp 未呼出 / `emailRedirectTo` が `/auth/confirm` /
  成功時「確認メール送信＋承認待ち案内」表示 / 登録済み・強度不足エラーの日本語化（signup-form 5件）。
- `next` サニタイズの全分岐をテストで固定（空・相対許可・絶対URL拒否・`//` 拒否・非スラッシュ拒否、5件）。
- ルーティング: `/signup`・`/auth/confirm` が未ログインで通過、ログイン済みは `/login`・`/signup` → `/`、
  保護パスは従来どおり未ログイン→`/login`（auth-routing 計8件）。
- `/auth/confirm` のコード机上トレース: token_hash 欠落・不正 type → `/login?error=...`、
  verifyOtp 失敗 → 同様、成功 → サニタイズ済み next へ redirect（セッション cookie は成功レスポンスに載る）。
- 既存ログインフォームへの変更が「新規登録」リンク追加のみであることを diff で確認。

## skipped_checks

メール送信を伴う実機確認（ローカル Supabase 起動時 or hosted 適用後に消化）:

- /signup → Inbucket/Mailpit で確認メール受信 → リンク → ログイン状態＋profiles=pending
- 確認リンクの再利用・期限切れ → `/login?error=auth_confirm_failed` で日本語案内
- メール未確認のままログイン → 確認を促すエラー
- 既存メールで再申請したときの挙動（Supabase は成功風レスポンス＝列挙攻撃対策）の文言確認
- 本番 Dashboard 設定（Confirm email ON / Redirect URLs）との結合確認（TKT-0233 ゲート）

## open_risks

- pending ユーザーが `/` に入れる穴は TKT-0230 が塞ぐまで残存（本番公開は 0230 完了後）。
- 「確認メールを送信しました」固定文言は、本番 Dashboard が Confirm email OFF の場合に実挙動と乖離する。
