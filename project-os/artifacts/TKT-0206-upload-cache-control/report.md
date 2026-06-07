---
ticket_id: TKT-0206-upload-cache-control
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

写真アップロードの全経路で Supabase Storage の `upload()` options に長期 `cacheControl: "31536000"`（約1年）を
付与し、署名URL再利用時のブラウザHTTPキャッシュ寿命を延ばす。content-addressed 運用（`upsert: false`、再アップロード
は別 path）のため、同一 path のオブジェクト内容は不変であり長期キャッシュが安全。TKT-0203/0204/0205 の「同一署名URL
再利用」と組み合わせて、`router.refresh()` 後などに同じ画像が再ダウンロードされる無駄を解消する狙い。

## 今回追加した安全装置

- 写真アップロードの全7経路に `cacheControl: "31536000"` を追加（`contentType` / `upsert: false` は維持）:
  - `inventory-board.tsx` … 料理写真 / 食材在庫画像 / ユーザー食材画像の3箇所
  - `cooking-record-edit-modal.tsx` … 料理写真
  - `recipe-meal-workspace.tsx` … 料理写真
  - `lib/photos/recipe-image-upload.ts` … レシピ画像コピー時 / レシピ画像アップロード時の2箇所
- `recipe-image-upload.ts` の最小クライアント型 `StorageBucketApi.upload` の options に `cacheControl?: string` を追加
  （Supabase 実型と整合。テスト用モック型・アサーションも追従）。
- 非公開 `photos` バケットのまま。バケット構成・RLS・auth・schema・撮影/圧縮フローは一切変更していない。

## 実施した確認

- `/verify`（lint / typecheck / test / build + policy）すべて pass。
- 自動テスト 301件 pass。`recipe-image-upload.test.ts` / `inventory-board.test.tsx` の upload options アサーションを
  `cacheControl: "31536000"` 込みに更新（仕様変更の期待値反映であり、テストの無効化はしていない）。
- 静的確認: 全7箇所で options に `cacheControl` が付与され、`upsert: false`（content-addressed）が維持されていることを
  grep・コード確認。
- **実Supabaseプローブ確認**（使い捨てスクリプトで `photos` バケットへ極小PNGを一時アップロード→署名URL→curl→即削除）:
  - オブジェクトメタデータに `cacheControl: "max-age=31536000"` が保存されることを確認（コード変更は正しく機能）。
  - **ただし署名URLのGET配信レスポンスには `cache-control` が出ず**（HEADは `no-cache`）、`expires` が署名URL TTL
    （アプリ既定30分）に連動することを確認。詳細は `manual-smokes.md` の executed_checks 参照。

## 残リスク

- **重要: 当初目的（cacheControl 付与で署名URL再利用時のブラウザHTTPキャッシュ寿命を延ばす）は本変更では達成されない。**
  非公開バケット＋署名URL配信では、Supabase はオブジェクトの `cacheControl` をブラウザ向け `cache-control` に
  伝播しない（プローブで実測）。ブラウザのキャッシュ寿命は **署名URL TTL（30分）＋同一URL再利用（TKT-0203/0204/0205）**で
  決まる。本変更は無害（メタデータ保存・CDNエッジTTLには寄与しうる）だが、ブラウザキャッシュ延長効果はほぼ無い。
- 既存オブジェクトには遡及しない（本変更以降の新規アップロード分のみ）。
- 危険eval `supabase_schema_change` は `/check-gates` の語彙過剰マッチ。schema/migration/RLS/バケット設定は無変更。
- 撮影UIの実機操作（カメラ撮影・プレビュー・撮り直し）はブラウザ実機が必要で未実施（`manual-smokes.md` skipped_checks）。

## 次の依頼や人判断

- **実体感のブラウザキャッシュ改善を狙う場合は別レバー（署名URL TTL の延長）が必要**。`USER_IMAGE_SIGNED_URL_TTL_SECONDS`
  （現30分）を延ばすと `expires` も延びるが、署名URLの長寿命化はセキュリティトレードオフがある。別チケットで要検討。
- 撮影フローの実機目視（撮影・プレビュー・撮り直し・保存後の表示）は引き続きユーザー確認推奨（回帰なし想定）。
- 学びは `project-os/knowledge/learnings.md` に記録済み（Supabase 署名URLと cacheControl の関係）。
