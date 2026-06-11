---
ticket_id: TKT-0229-signup-request-flow
status: ready
---

# Report Draft

## 変更目的

承認制ログイン（SPEC-0228 ②/⑥）の登録受け口。これまで新規ユーザーは Supabase Dashboard での
手動作成しか手段がなかった。`/signup`（メール＋パスワード＋確認入力）とメールリンク処理ルート
`/auth/confirm` を新設し、未知のユーザーが自分で登録申請できるようにした。
登録直後は TKT-0228 のトリガーにより profiles=pending（承認待ち）になる。

## 今回追加した安全装置

- `/auth/confirm` の `next` パラメータをサニタイズ（`sanitizeNextPath`: 相対パスのみ許可、
  `//`・`/\` のプロトコル相対URL拒否）→ オープンリダイレクト防止。`new URL(next, origin)` で
  same-origin に閉じて解決。
- `verifyOtp` の type を許可リスト（signup/email/recovery）で検証。不正 type・token 欠落は
  `/login?error=auth_confirm_failed` へ。
- Supabase の生エラーメッセージを画面に出さず日本語変換（登録済み/強度不足/signup停止/レート制限）。
- パスワード確認入力の不一致はクライアント側で送信前に弾く（signUp 未呼出をテストで固定）。
- 公開パスは `isPublicPath`（/login・/signup 完全一致＋/auth/ 配下）に限定。他は従来どおり未ログイン→/login。
- クライアントは既存 anon key 経路（`createBrowserSupabaseClient`）のみ。秘密鍵・service role 不使用。

## 実施した確認

- `/verify TKT-0229`: lint / typecheck / test / build すべて pass（verify.json 参照）。
  テストは signup-form 5件・safe-next-path 5件・auth-routing 追加6件を含む。
- オーケストレーターによるレビュー（review.md 参照）。指摘1件（クエリ付き `next` の
  pathname 代入でのエンコード壊れ）を `new URL` 方式へ修正済み。
- ローカル `supabase/config.toml` を `enable_confirmations = true`・redirect URLs 追加へ更新。

## 残リスク

- 本番 Dashboard の Auth 設定（Confirm email ON・enable_signup ON・Redirect URLs に本番
  `/auth/confirm`）は config.toml では反映されない。TKT-0233 runbook で適用必須。
  Dashboard が Confirm email OFF のままだと「確認メールを送信しました」の案内と実挙動が乖離する。
- メール確認直後の pending ユーザーは現状 `/` に入れてしまう（承認ゲートは TKT-0230 で結合。
  チケットの非ゴールどおり）。**TKT-0230 完了までは本番公開しない前提**。
- Supabase 標準メールのレート制限（時間あたり数通）。少人数前提で許容、SMTP 移行は TKT-0233 手順のみ。
- check-gates の photo/csv eval 表示は作業ツリーの他チケット未コミット変更による過剰マッチ。
  本チケットの実変更に写真Storage・CSV移行はない。

## 次の依頼や人判断

- TKT-0230（承認ゲート）の実装続行（本チケットの穴=pending が `/` に入れる、を塞ぐ）。
- ローカル Supabase 環境を使う場合は Inbucket/Mailpit（127.0.0.1:54324）でメールリンクを確認。
