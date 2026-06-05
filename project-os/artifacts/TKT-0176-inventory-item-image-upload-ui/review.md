# TKT-0176 レビュー

## 結論

重大な未解決リスクは見つからない。Web版verifyはpass。

## 確認した観点

- Canvas版 `app.html` は編集していない。
- APIキー、Service Role key、公開URL、署名付きURLの直書きなし。
- 画像本体は非公開 `photos` バケット、DB保存値はStorage pathのみ。
- `user_ingredient_images` はRLSで本人限定。Storage pathの先頭フォルダが `user_id` と一致する制約あり。
- 表示優先順位は、在庫個別画像、ユーザー食材名画像、標準画像、絵文字の順。
- 買い物リストは明示保存済みのユーザー食材名画像だけを使い、個別在庫画像は使わない。
- 食材名の正規化はNFKC、小文字化、空白除去でTKT-0175 resolverと同じ方針。

## 残リスク

- Supabase migrationはローカル実装のみ。実環境へ反映するまで `user_ingredient_images` テーブルは存在しない。
- 実Storageアップロードは副作用を避けるため手動実行していない。mockテストで保存・upsertの呼び出しを確認済み。
