---
ticket_id: TKT-0173-user-image-schema-and-storage
status: ready
reported_at: 2026-06-05T06:00:00+09:00
---

# Report

## 変更目的

レシピ画像・食材画像をユーザーが安全に登録できるようにするための **DB/Storage 共通基盤**を作る。
UI（アップロード操作）は後続チケット TKT-0174 / TKT-0176 で実装する。本チケットは
列追加・保存先/権限の確定・表示用ヘルパーの土台までに限定する。

## 今回追加した安全装置

- 公開バケット化・公開URL保存をしない。DB には **Storage path のみ**保存し、表示は短期の**署名付きURL**。
- 既存の非公開 `photos` バケットを再利用。新しい path も先頭フォルダが user_id のため
  **既存の本人限定 storage policy でそのまま保護**される（新規ポリシー追加なし＝緩む余地なし）。
- DB側 **CHECK 制約**（`*_image_path_owned`）で、他人領域を指す path の保存を拒否（policy と二重防御）。
- 新列は nullable・既存行は null のまま。既存データの削除・上書き・移行をしない（列追加のみ）。
- Service Role key をブラウザに出さない。APIキー・秘密鍵を直書きしない（`process.env` 経由のみ）。

## バケット選定（owner_notes の判断ポイント）

- **既存 `photos` バケットを再利用**（新規バケットは作らない）。
- 理由: `photos` は schema_v1 で既に非公開（`public = false`）。storage.objects policy が
  `(storage.foldername(name))[1] = auth.uid()::text` で本人限定済み。新 prefix
  （`recipe-images/` / `inventory-images/`）も先頭が user_id のため追加ポリシー不要。
  既存 prefix（`cooking-history/` / `ingredient-scan/`）と衝突しない。

## 変更内容

- `supabase/migrations/20260605120000_user_image_columns.sql`（新規）
  - `recipes.image_storage_path text`（nullable）/ `inventory_items.image_storage_path text`（nullable）を追加。
  - 防御的 CHECK 制約: `image_storage_path is null or split_part(image_storage_path,'/',1) = user_id::text`。
  - 列コメントで「公開URLではなく Storage path」「null=画像なし」を明記。新規 storage/table policy は作らない。
- `web/src/lib/photos/compress.ts`
  - `buildRecipeImageStoragePath` → `<uid>/recipe-images/<recipe_id>/<uuid>.webp`
  - `buildInventoryImageStoragePath` → `<uid>/inventory-images/<item_id>/<uuid>.webp`
- `web/src/lib/photos/user-image.ts`（新規）
  - `PHOTOS_BUCKET` / `USER_IMAGE_SIGNED_URL_TTL_SECONDS` と署名付きURL共通関数 `createUserImageSignedUrl`。
- 型: `Recipe` / `StockItem` に `image_storage_path: string | null` を追加。
  insert系（`toStagingInsert` / `toInventoryInsert` / `InventoryInsert`）は作成時画像なしのため Omit。
- テスト: `web/src/__tests__/user-image.test.ts`（新規7件）＋既存fixtureへ `image_storage_path: null` 補完。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0173-...`: **pass**（lint / typecheck / test / build）。
  policy: GAS無 / 秘密無 / RLS有。
- `npx vitest run`（user-image + 影響テスト）: 67件 pass。
- 静的レビュー（schema/RLS/Storage）: `review.md`。public化なし・新規ポリシーなし・既存ポリシーで本人限定成立を確認。
- migration の実機適用は**未実施**（方針: 明示依頼時のみ）。適用手順とクロスユーザー確認は `manual-smokes.md`。

## 残リスク

- 本番/hosted DB への migration 適用は未実施。適用とStorage/RLS実機確認はユーザーが行う（`manual-smokes.md`）。
- Storage policy 誤設定は重大だが、本チケットは既存ポリシー再利用のため新規誤設定リスクは低い。
  適用後にクロスユーザー read 拒否の確認を推奨。
- 画像差し替え/削除時の旧オブジェクト削除、webp圧縮経路は後続チケットで実装（本チケット非対象）。

## 次の依頼や人判断

- dev DB に migration を適用し、`manual-smokes.md` の A〜D を確認する（本番適用は明示依頼時のみ）。
- 続けて TKT-0174（レシピ画像アップロードUI）/ TKT-0176（食材画像アップロードUI）に着手する。
  その際、`compressImageFile` の webp 出力対応と差し替え時の旧 Storage オブジェクト削除を必ず入れる。

## 過剰マッチ

`csv_import_migration` eval は `supabase/migrations/` の path に含まれる `migration` 語で過剰マッチした。
実態は**列追加の migration であり、CSV/Spreadsheet からのデータ移行ではない**。
危険対象として妥当な `supabase_schema_change` / `auth_and_rls_policy` / `photo_upload_storage` 向けに
`review.md` / `manual-smokes.md` を作成済みで、必要な確認はカバーされている。
