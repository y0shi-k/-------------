---
ticket_id: TKT-0232-password-reset-flow
status: ready
---

# Report Draft

## 変更目的

承認制ログイン（SPEC-0228 ⑤/⑥）。パスワードを忘れたユーザーの救済が Supabase Dashboard 手動対応
しかなかった。`/forgot-password`（recovery メール送信）と `/reset-password`（新パスワード設定）を
新設し、ユーザーが自力で復旧できるようにした。メールリンク処理は TKT-0229 の `/auth/confirm`
（type='recovery' 対応済み）を共用。

## 今回追加した安全装置

- **メールアドレス存在有無の非露出**: resetPasswordForEmail の未登録エラーも成功と完全同一の
  「メールを送信しました」表示に倒す（レート制限のみ別文言）。テストで同一性を固定。
- `/reset-password` は承認ゲートの**最小例外**としてのみ素通し: pending/disabled は他の全パスが
  /pending 固定のまま（リセット後も未承認はデータ画面に入れない）。テストで固定。
- `/forgot-password` は公開パス（未ログイン専用。ログイン済みは page 側で / へ）。
- `/reset-password` の unauthenticated 直叩きは /login へ（公開扱いにしない）。
  サーバー側 getUser ガード＋middleware の二層。
- エラーの日本語変換（弱いPW・同一PW・セッション切れ・レート制限）。生エラー非露出。
- redirectTo は `/auth/confirm?next=/reset-password`＝TKT-0229 のサニタイズ・same-origin 解決を通る。

## 実施した確認

- `/verify TKT-0232`: lint / typecheck / test / build すべて pass（verify.json 参照）。
- テスト: forgot（成功/未登録で同一文言・redirectTo 検証）、reset（不一致エラー・updateUser・成功表示）、
  routing（公開パス＋pending/disabled の /reset-password 素通し・他パス /pending 固定）。
- オーケストレーターが routing.ts の状態×パス表を監査。指摘なし。

## 残リスク

- アプリ側レート制限なし（非ゴール）。Supabase 標準の制限のみ。公開規模拡大時に別チケット。
- recovery リンク期限切れ・再利用は `/auth/confirm` → `/login?error=auth_confirm_failed` に倒れるが、
  /login 側の error クエリの文言表示は未実装（現状エラー無表示でログイン画面に戻るのみ）。
  UX 改善は軽量チケットで対応可。
- 実メールでの E2E は未検証（hosted 適用後の manual-smokes で消化）。
- check-gates の photo/csv eval は他チケット未コミット変更の過剰マッチ（実変更は web/ の認証UIのみ）。

## 次の依頼や人判断

- TKT-0233（本番適用 runbook）で本イニシアチブのコード実装は完了。
- /login の error クエリ表示（auth_confirm_failed・reset_session_missing）の文言化を
  やるかどうか（軽量UI改善。既存の関連チケットに集約可）。
