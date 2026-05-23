# Report: TKT-0102

Status: ready

## Summary

SupabaseをWeb版から安全に使うための接続準備を追加しました。

今回の変更では、ブラウザ用clientとサーバー用clientを分けました。ブラウザ側は公開してよいanon keyだけを使い、強い権限を持つservice role keyはサーバー側だけで扱う構造にしています。

## Changed

- `@supabase/supabase-js` を追加しました。
- `server-only` を追加し、サーバー専用Supabase clientをブラウザ側から使えないようにしました。
- `web/.env.example` に公開値と秘密値の区別を追加しました。
- `web/src/lib/supabase/` にbrowser/server clientと環境変数 helperを追加しました。
- Supabase環境変数の分離テストを追加しました。
- トップ画面の表示をTKT-0102の範囲に更新しました。
- `docs/runbook/Supabase登録の詳細手順.md` を追加しました。
- `docs/index.md` からSupabase登録手順へ辿れるようにしました。
- TKT-0102のacceptanceとchanged_pathsへ手順書追加を反映しました。

## Not Changed

- Supabase本番プロジェクトは作成していません。
- DBテーブル、RLS、Storage bucketは作成していません。
- Vercel環境変数は設定していません。
- 実際の秘密鍵やAPIキーは追加していません。

## Verify

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
- 秘密情報の実値検索: passed
- ローカルブラウザ表示確認: passed
- スマホ幅表示確認: passed

## Next

TKT-0103に入る前に、ユーザーが `docs/runbook/Supabase登録の詳細手順.md` に沿ってSupabase登録とプロジェクト作成を行い、`web/.env.local` に実値を入れる。
