---
ticket_id: TKT-0172-web-demo-seed-and-images
status: passed
checked_at: 2026-06-04T21:32:00+09:00
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
  - csv_import_migration
---

# Manual Smokes

## 結論

TKT-0172 の手動確認は、実行可能な範囲で完了。画像は静的配置され、ホームのヒーロー画像はブラウザ上で表示確認済み。既存DBには今回のデモレシピ名が無いため、レシピカードはプレースホルダ表示のまま崩れないことを確認した。

## target_evals

- `supabase_schema_change`: 過剰マッチ。schema変更なし。
- `auth_and_rls_policy`: 過剰マッチ。RLS policy変更なし。シードは既存RLS下で動く設計。
- `photo_upload_storage`: 過剰マッチ。Supabase Storage変更なし。静的画像のみ。
- `csv_import_migration`: 過剰マッチ。CSV移行ではなくデモ追加スクリプト。

## 確認内容

- `http://localhost:3001` でWeb版を表示（既存の `3000` が使用中だったためNext.jsが `3001` を使用）。
- ホーム画面で `/images/hero/home-hero.webp` の `<img>` がDOMに存在し、画面右側にヒーロー画像が表示されることを確認。
- レシピ一覧で、既存レシピ名が今回の静的mapと一致しない場合にプレースホルダのまま表示され、カード崩れが起きないことを確認。
- `sips` で画像寸法を確認。
- レシピ画像6枚: すべて `640x480`
- ヒーロー画像: `1200x400`
- `du` で画像合計サイズを確認。
  - レシピ6枚 + ヒーロー1枚: 合計 `212K`

## executed_checks

- ホーム画面ブラウザ表示。
- レシピ一覧ブラウザ表示。
- 画像寸法確認。
- 画像容量確認。
- `check-gates` 過剰マッチ内容の分類。

## 未実施・理由

- シードスクリプトのDB投入は未実施。理由: チケット方針どおり、ユーザーが自分のDBに対して明示実行する手段だけを用意し、自動実行しないため。
- デモレシピ投入後の「レシピ一覧/詳細/提案で実写真が出る」完全な目視は未実施。理由: 上記と同じく、DBへのシード投入をこの作業中に行っていないため。
- `curl -I http://localhost:3001/...` による静的配信確認はこのシェル環境から接続できず失敗。ブラウザ上のホーム表示とファイル実体・寸法確認で代替した。

## skipped_checks

- DBへのシード投入: ユーザー明示実行が前提のため未実施。
- デモ投入後の全画面写真目視: DBへ投入していないため未実施。
- `curl` でのHTTPヘッダー確認: このシェル環境からローカルサーバーへ接続できなかったため未実施。

## open_risks

- DB投入後の全画面写真表示は、ユーザーがシードを明示実行した後に改めて確認が必要。
- `SUPABASE_AUTH_TOKEN` の扱いに注意が必要。

## 過剰マッチの記録

`check-gates` は `scripts/` と画像配置により `supabase_schema_change` / `auth_and_rls_policy` / `photo_upload_storage` / `csv_import_migration` を危険変更として検出した。実態は以下のとおり。

- Supabase schema / RLS / Storage は変更していない。
- 画像は `web/public/` の静的ファイルで、Supabase Storage は使っていない。
- `scripts/seed-demo-recipes.mjs` はデモデータ追加手段であり、CSV移行ではない。
- シードは既存データを削除・上書きしない。
