---
ticket_id: TKT-0149
status: ready
---

# TKT-0149 report

## 変更目的

他ユーザーへ公開する前に、短いパスワード、自由登録、ブラウザ側防御不足によるリスクを下げる。

## 今回追加した安全装置

- Supabase Authのローカル設定で、初期公開時の自由登録を無効化。
- パスワード最小文字数を8文字に変更し、英字・数字必須に変更。
- メール確認と安全なパスワード変更を有効化。
- Next.jsに次のセキュリティヘッダーを追加。
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- 本番Supabase/Vercelで必要な手動確認をrunbookへ追加。

## 実施した確認

`harness/bin/verify_web.sh TKT-0149`

- lint: pass
- typecheck: pass
- test: pass
- build: pass
- no_gas_dependency: pass
- no_hardcoded_secret: pass
- supabase_rls_present: pass

追加確認:

- ログイン画面表示: pass
- 管理者作成ユーザーのログイン: pass
- ログイン後のアプリ起動: pass
- AI API route退行確認: pass
- 写真表示関連テスト: pass

## 残リスク

- 本番Supabase DashboardのAuth設定は、ローカルファイルだけでは反映されない可能性がある。
- CSPは初回導入のため保守的に設定している。独自ドメインや外部画像ドメインを追加する場合は見直しが必要。
- 外部Gemini APIの実呼び出しは、外部送信と課金を避けるため今回の手動確認では実施していない。

## 次の依頼や人判断

- 公開直前にSupabase DashboardでAuth設定を確認する。
- 公開直前にVercelの環境変数を確認する。
- 一般公開で自由登録に戻す場合は、メール確認とCAPTCHAを先に検討する。
