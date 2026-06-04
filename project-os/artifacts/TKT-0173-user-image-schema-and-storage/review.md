---
ticket_id: TKT-0173-user-image-schema-and-storage
status: passed
checked_at: 2026-06-05T06:00:00+09:00
review_scope:
  - DB列追加（recipes / inventory_items の image_storage_path）
  - Storage path 規約と既存ポリシーの本人限定
  - 防御的 CHECK 制約
  - 署名付きURL表示ヘルパーと型整合
---

# Review

schema / auth・RLS / Storage の危険evalに対する静的レビュー。

## 結論

既存の本人限定モデル（非公開 `photos` バケット＋`foldername[1]=auth.uid` policy、行ベース RLS）を
踏襲し、新たな漏えい経路を作っていない。**approve**。本番適用は明示依頼時のみ。

## 確認したこと

- migration が冪等（`add column if not exists` / `drop constraint if exists` → `add`）。
- 列は nullable・default 無し・既存行 null 維持。型変更/削除/リネーム/データ移動なし。
- 公開URLを保存せず Storage path のみ。表示は `createSignedUrl`（短期）。

## checked_diff_paths

- `supabase/migrations/20260605120000_user_image_columns.sql`
- `web/src/lib/photos/compress.ts`
- `web/src/lib/photos/user-image.ts`
- `web/src/lib/recipes/types.ts` / `web/src/lib/inventory/types.ts`
- `web/src/lib/ai/ingredient-scan.ts` / `web/src/components/inventory-board.tsx`
- `web/src/__tests__/user-image.test.ts` ほか fixture 補完

## checked_artifacts

- `verify.json`（status=pass）
- `manual-smokes.md`（target_evals・適用/権限確認手順）
- `report.md`

## findings

- **RLS**: `recipes` / `inventory_items` は schema_v1 で RLS 有効＋`auth.uid()=user_id`。
  新列は行に属するため既存ポリシーで保護。列単位ポリシー不要。新規ポリシー追加なし＝緩む余地なし。 ✅
- **Storage**: `photos` は `public=false`。既存4ポリシーが `bucket='photos' and foldername[1]=auth.uid()`。
  新 path（`<uid>/recipe-images/...` `<uid>/inventory-images/...`）は先頭 user_id のため本人限定が成立。
  既存 prefix と非衝突。 ✅
- **CHECK 制約**: `split_part(path,'/',1)=user_id::text` で他人領域 path を DB が拒否（policy と二重防御）。
  `split_part` は immutable で CHECK 使用可。 ✅
- **秘密情報**: migration/lib に APIキー・DBパスワード・Service Role の直書きなし（verify: secret=pass）。
  ヘルパーは anon クライアント前提で Service Role を要求/露出しない。 ✅
- **アプリ整合**: `select("*")` で新列透過、型反映済み、typecheck pass。insert は Omit で作成時画像なしを表現。 ✅

## リスク

- 本番/hosted 適用時の policy 実機確認が残る（既存ポリシー再利用のため新規誤設定リスクは低い）。
- 後続UIで webp圧縮・旧オブジェクト削除を入れないとリーク/形式不整合の恐れ（本チケット非対象）。

## open_risks

- migration 実機適用は未実施。適用後に `manual-smokes.md` のクロスユーザー read 拒否を確認すること。
- TKT-0174 / TKT-0176 で画像差し替え時の旧 Storage オブジェクト削除を必須化すること。

## verdict

approve。schema/RLS/Storage に新たな漏えい経路なし。本番適用は明示依頼時のみ、適用後にクロスユーザー確認を推奨。

## Verify

`harness/bin/verify_web.sh TKT-0173-...` → pass（lint/typecheck/test/build, policy GAS/secret/RLS）。
