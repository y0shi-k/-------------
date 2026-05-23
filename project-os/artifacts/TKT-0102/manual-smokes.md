# Manual Smokes: TKT-0102

Status: done

## 静的確認

- [x] `web/.env.example` にSupabase、Gemini、DB passwordの変数名がある。
- [x] `NEXT_PUBLIC_` 付きの値と、秘密にする値が分かれている。
- [x] browser clientは `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` だけを使う。
- [x] server clientは `server-only` で保護し、`SUPABASE_SERVICE_ROLE_KEY` をサーバー側に閉じる。
- [x] 非エンジニア向けの `docs/runbook/Supabase登録の詳細手順.md` を追加した。
- [x] `docs/index.md` からSupabase登録手順へ辿れる。
- [x] ローカルブラウザで `http://localhost:3001` を開き、TKT-0102の表示を確認した。
- [x] スマホ相当の幅 `390x844` で、主要文言が表示されることを確認した。

## 実機・外部サービス確認

- [ ] Supabaseアカウント登録とプロジェクト作成は未実施。
- [ ] 実際のProject URL、anon key、service role keyを使った接続確認は未実施。
- [ ] Vercel環境変数設定は未実施。

## 未実施理由

TKT-0102では、Supabase本番プロジェクト作成、Vercel設定変更、本番DB操作は明示依頼がある場合だけ行うルールです。今回はコード側の安全な接続口と手順書の作成までを対象にしました。

## ユーザー側で後から行う確認

TKT-0102完了後、TKT-0103に進む前に `docs/runbook/Supabase登録の詳細手順.md` に沿ってSupabaseプロジェクトを作成し、`web/.env.local` に実値を入れてください。秘密鍵はチャットやMarkdownに貼らないでください。
