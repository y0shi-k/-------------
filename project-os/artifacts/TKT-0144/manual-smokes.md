---
ticket_id: TKT-0144-inventory-storage-location-tag-picker
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

> 補足: 本変更はUI改修＋既存 storage_locations テーブルへの insert のみ。Supabase schema / migration / RLS / auth / 写真Storage は変更していない。
> check-gates は diff（inventory-board.tsx）内の既存文字列 `storage_locations` / `inventory_items` / `storage.from("photos")` に反応して
> supabase_schema_change と photo_upload_storage を保守的にマッチしたため、データ保護面・Storage面の不変を静的確認として記録する。

## target_evals

- supabase_schema_change（保守的マッチ。実体はスキーマ変更なし、既存テーブルへのinsertのみ）
- photo_upload_storage（保守的マッチ。写真Storage/アップロードのコードは未変更）

## executed_checks

- web_auth_guard（認証ガード）: 変更にログイン/認可・middlewareの変更が無いことを確認。`addStorageLocation` は `storage_locations` へ `user_id: userId` 付きで insert し、insert RLS（auth.uid() = user_id）に適合。
- web_storage_security（写真Storage権限）: 写真Storage（`supabase.storage.from("photos")` 周辺＝既存の画像スキャン）は本チケットで未変更。保存場所ピッカーは写真Storageに触れない。
- スキーマ不変性: `storage_locations` は既存テーブル（migration 20260524161600）。本変更は migration/RLS/列定義を変更せず、`{ user_id, name, sort_order }` の insert のみ。`storage_location`（食材の単一文字列）も形は不変。
- 重複防止: 追加前に `storageLocations.some(name===)` で重複チェック＋テーブルの `unique(user_id,name)`。
- 自動テスト: `npm run test` で「保存場所ピッカーから新規作成→storage_locations へ insert」を検証（54/54 成功）。既存の手動在庫追加（既定値依存）も継続成功。
- verify: lint/typecheck/test/build すべてpass、policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）すべてpass（verify.json）。

## skipped_checks

- 実機ブラウザでのログイン後の新規保存場所作成→上部タブ反映の手動確認: ローカル/CIに本番相当セッションが無いため静的確認に留めた。コンポーネントテストが新規作成→insert→チップ表示を代替検証している。
- RLS policyの実DB往復確認: policy/スキーマを変更していないため不要と判断。

## open_risks

- 実機（ログイン済み）での新規保存場所の作成→タブ反映の目視は未実施。データ保護面の挙動には影響しない。
