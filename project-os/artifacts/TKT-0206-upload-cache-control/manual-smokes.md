---
ticket_id: TKT-0206-upload-cache-control
status: passed
execution_mode: static_only
target_evals:
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `photo_upload_storage` 🔴 本物の該当。実アップロード経路（`upload()` options）に `cacheControl: "31536000"` を追加。
  バケット公開化・RLS・撮影/圧縮フローは無変更。
- `supabase_schema_change` 🔴 `/check-gates` による語彙過剰マッチ。**schema/migration/RLS/バケット設定 無変更**。

## executed_checks

> `status: passed` は **execution_mode: storage_probe**（自動verify＋実Supabaseへのプローブ確認）で pass の意。
> 撮影UIの実機操作（カメラ撮影・プレビュー・撮り直し）はブラウザ実機が必要で skipped_checks に残す。

- `/verify`（lint / typecheck / test / build）: pass。
- 自動テスト 301件 pass。upload options アサーション（`recipe-image-upload.test.ts` / `inventory-board.test.tsx`）が
  `cacheControl: "31536000"` 込みで成立することを確認。
- 静的確認: 写真アップロード全7経路で options に `cacheControl: "31536000"` が付与され、`upsert: false`
  （content-addressed）が維持されていることを grep・コード確認。
- **実Supabaseプローブ（使い捨てスクリプトで `photos` バケットへ極小PNGを一時アップロード→署名URL→curlでヘッダ確認→即削除）**:
  - ✅ オブジェクトメタデータに `cacheControl: "max-age=31536000"` が保存される（`storage.list` の metadata で確認）。
    → **コード変更（options への cacheControl 付与）は正しく Supabase に届いている**。
  - ⚠️ ただし**署名URLのGET配信レスポンスには `cache-control` が現れない**（HEAD は `cache-control: no-cache`）。
    代わりに `expires` ヘッダが**署名URLのTTL**（アプリ既定 `USER_IMAGE_SIGNED_URL_TTL_SECONDS = 30分`）に連動する。
    前段に Cloudflare CDN（`cf-cache-status: MISS`）。
  - 結論: 非公開バケット＋署名URL配信では、オブジェクトの `cacheControl` はブラウザ向け `cache-control` に
    伝播しない。ブラウザのキャッシュ寿命を決めるのは**署名URL TTL（30分）＋同一URL再利用（TKT-0203/0204/0205）**であり、
    本チケットの `cacheControl: "31536000"` ではない（→ [[learnings]] に記録）。

## skipped_checks

> 以下は dev サーバ＋ブラウザ実機（カメラ）でのみ確認可能。プローブ検証の対象外。

- [ ] スマホ/タブレットで料理写真を撮影→プレビュー→撮り直し→保存の一連が従来どおり動く。
- [ ] 食材在庫画像 / ユーザー食材画像 / レシピ画像のアップロードが従来どおり動く。
- [ ] 保存後の表示（在庫一覧・料理記録・レシピ）に回帰がない。

## open_risks

- **当初目的（署名URL再利用時のブラウザHTTPキャッシュ寿命延長）は本変更では達成されない**ことがプローブで判明。
  変更自体は無害（メタデータ保存・CDNエッジTTLには寄与しうる）だが、ブラウザキャッシュの実レバーは署名URL TTL。
  実体感改善を狙うなら別チケット（署名URL TTL 延長＝セキュリティトレードオフあり）で扱う。
- 既存オブジェクトは遡及せず（本変更以降の新規アップロード分のみメタデータ付与）。
- 危険eval `supabase_schema_change` は語彙過剰マッチ。バケットは非公開のまま・RLS・公開設定は無変更のため
  Storage セキュリティ面の新規リスクはないと判断。
