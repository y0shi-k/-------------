# TKT-0117 Review

## 確認結果

- `inventory_items` と `staging_items` に `unit_conversion jsonb` を追加するmigrationを作成した。
- RLS対象の既存tableに列を追加するだけなので、本人データ制限の考え方は変えていない。
- APIキー、Supabase秘密鍵、写真URLの直書きは追加していない。
- Web版にGAS、Google Spreadsheet、Google Drive利用は追加していない。

## CSV移行方針

- Canvas版の `単位換算JSON` は、空なら `null`、値があればJSONとして `unit_conversion` に投入する。
- 形式は `{ "fromQty": 1, "fromUnit": "パック", "toQty": 150, "toUnit": "g" }` を正とする。
- 壊れたJSONや数量/単位が欠けた行は移行時に `null` に落とし、必要ならWeb画面で手修正する。

## リスク

- Supabase migrationを適用するまで、換算情報つき保存は実DBで失敗する。
- 調理完了時の自動減算はこのチケットでは未実装。`TKT-0125` で今回の保存形式を使う。
