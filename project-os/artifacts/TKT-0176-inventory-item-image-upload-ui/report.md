# TKT-0176 実装報告

## 実装内容

- 在庫編集モーダルに食材画像の選択、プレビュー、取り消し、削除UIを追加した。
- 保存時に画像を圧縮し、非公開 `photos` バケットへアップロードする処理を追加した。
- `inventory_items.image_storage_path` を個別在庫画像として更新する処理を追加した。
- `user_ingredient_images` テーブルを追加し、「同じ食材名にも使う」設定でユーザー別・正規化食材名別に画像を記憶できるようにした。
- 在庫一覧の表示優先順位を、個別在庫画像、ユーザー食材名画像、標準画像、絵文字の順にした。
- 買い物リストは、明示保存済みのユーザー食材名画像がある場合だけ表示に使うようにした。
- スマホ幅で画像UIのボタンがはみ出さないCSSを追加した。

## 検証

- `npm run typecheck`: pass
- `npm test -- --run src/__tests__/ingredient-image.test.ts src/__tests__/inventory-board.test.tsx`: pass
- `npm run lint`: pass
- `harness/bin/verify_web.sh TKT-0176-inventory-item-image-upload-ui`: pass
- Browser確認: 通常幅と390px幅で画像UIの表示崩れなし。

## セキュリティ

- 公開URLと署名付きURLはDBへ保存しない。
- Storage pathの先頭フォルダが本人の `user_id` であることをDB制約でも確認する。
- `user_ingredient_images` はRLSで本人だけがselect/insert/update/deleteできる。

## 注意

- Supabaseへ反映するにはmigration pushが必要。
- 実Storageアップロードの手動smokeは、本番/共有DBへの副作用を避けるため未実施。
続けて