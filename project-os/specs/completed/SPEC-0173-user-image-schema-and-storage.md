---
id: SPEC-0173-user-image-schema-and-storage
title: ユーザー登録画像のDB/Storage基盤（レシピ・食材共通）
status: spec_ready
scope:
  - supabase/migrations/
  - web/src/lib/
  - docs/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Supabase Storage は非公開バケットを前提にする
  - Service Role key をブラウザに出さない
  - 画像URLやStorage pathを公開URLとして保存しない
  - 既存の写真アップロード（料理記録・食材スキャン）を壊さない
acceptance:
  - `recipes` にユーザー登録画像を参照する列が追加される
  - `inventory_items` にユーザー登録画像を参照する列が追加される
  - Storage path は `auth.uid()` 配下に限定され、本人以外が読めない
  - 画像表示は署名付きURL（短時間だけ有効なURL）を前提にする
  - 既存データは画像なしとして移行され、既存レシピ・在庫が消えない
  - schema / RLS / Storage の確認内容が artifact に残る
  - Web版verifyが通る
related_tickets:
  - TKT-0173-user-image-schema-and-storage
---

# Summary

レシピ画像と食材画像をユーザーが登録できるようにするため、DB列とStorage権限の共通基盤を作る。TKT-0174/0176 のUI実装前に、保存先・権限・表示方式を固定する。

## 背景

TKT-0172 の固定map方式はデモ確認用であり、実運用ではユーザーが画像を追加できない。正式機能では、画像は個人データになりうるため、Storageを非公開にし、本人だけが扱える必要がある。

## 仕様

- `recipes` に画像Storage path用の列を追加する。
  - 例: `image_storage_path text`
  - 公開URLではなくStorage pathだけ保存する。
- `inventory_items` に画像Storage path用の列を追加する。
  - 例: `image_storage_path text`
  - 食材マスタではなく、まず在庫アイテム単位で持つ。
- Storageは既存 `photos` バケットを再利用するか、新規バケットにするかを実装前に判断し、理由をreportに残す。
  - 推奨: 既存 `photos` バケットを使い、path prefixで `recipe-images/` / `inventory-images/` を分ける。
- pathは必ず `user_id` を含める。
  - 例: `<user_id>/recipe-images/<recipe_id>/<uuid>.webp`
  - 例: `<user_id>/inventory-images/<item_id>/<uuid>.webp`
- RLSとStorage policyは本人限定にする。
- 署名付きURL生成の共通関数を作る場合は、既存の写真表示と責務が重ならないようにする。

## 非対象

- レシピ編集UIでのアップロード実装（TKT-0174）。
- 食材標準画像カタログ（TKT-0175）。
- 食材編集UIでのアップロード実装（TKT-0176）。
- 既存デモ画像の削除。

## 実装メモ

- migration追加後、既存レコードは `null` のままにする。
- Storage pathの削除漏れを防ぐため、UI側チケットでは画像差し替え時に古いStorage objectを削除する。
- 画像はWebP圧縮を前提にし、元画像をそのまま永続保存しない。
- `supabase_schema_change` / `auth_and_rls_policy` / `photo_upload_storage` の危険eval対象。manual-smokes / review が必要。

## 残リスク

- Storage policyを誤ると画像が他人に見える可能性がある。
- 既存 `photos` バケットを再利用する場合、料理記録写真とのpath衝突を避ける必要がある。
- 本番DBへのmigration適用は明示依頼がある場合だけ行う。
