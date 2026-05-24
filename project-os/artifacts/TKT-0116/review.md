# TKT-0116 Review

## 確認結果

- `storage_locations` は `user_id` を持つ本人専用tableとして追加した。
- RLSはselect/insert/update/deleteすべて `auth.uid() = user_id` に制限した。
- APIキー、Supabase秘密鍵、写真URLの直書きは追加していない。
- Web版にGAS、Google Spreadsheet、Google Drive利用は追加していない。

## CSV移行方針

- 旧Spreadsheetの保存場所は、CSV移行時に `storage_locations.name` へ重複なしで投入する。
- `inventory_items.storage_location` と `staging_items.storage_location` は既存通り文字列を保持する。
- 保存場所名が空の行は `その他` として扱う。
- 保存場所の表記ゆれ統合は、移行前クリーニングまたは移行スクリプト側の正規化で扱う。

## リスク

- DBにmigrationを適用するまで、本番/共有環境では `storage_locations` 取得が失敗する。公開前にSupabase migration適用が必要。
- `inventory_items.storage_location` は外部キー化していない。既存データとCSV移行の柔軟性を優先したため。
