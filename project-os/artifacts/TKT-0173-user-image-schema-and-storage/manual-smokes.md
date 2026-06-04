---
ticket_id: TKT-0173-user-image-schema-and-storage
status: passed
checked_at: 2026-06-05T06:00:00+09:00
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
  - csv_import_migration
---

# Manual Smokes

本チケットは DB/Storage 基盤のみで UI が無い。自動 verify に加えて、migration 適用と
Storage/RLS の実機確認手順を残す。**本番/hosted DB への適用は未実施**（方針: 明示依頼時のみ）。

## 結論

基盤実装は静的に確認済み（verify pass・SQLレビュー済み）。実機の migration 適用と
クロスユーザー権限確認は、ユーザーが自分の dev DB で下記手順を実施する前提で open。

## executed_checks

- `harness/bin/verify_web.sh TKT-0173-...` → pass（lint / typecheck / test / build, policy GAS/secret/RLS）。
- `npx vitest run`（user-image + 影響テスト）→ 67件 pass。
- migration SQL の静的レビュー（`review.md`）。`public=false` 維持・新規ポリシー無し・
  既存ポリシーで本人限定が成立することを確認。
- path 規約が先頭 user_id であることを `user-image.test.ts` で固定。

## skipped_checks

> ユーザーが dev DB で実施する手順（このチケット作業内では未実行）。

### A. migration 適用

- `supabase migration up`（または `supabase db reset`）。hosted は明示依頼時のみ `supabase db push`。
- `recipes` / `inventory_items` に `image_storage_path`（text, nullable）が追加されること。
- 既存行が `null` のまま・件数が変わらないこと。CHECK 制約 `*_image_path_owned` が存在すること。

### B. CHECK 制約（本人領域のみ許可）

- 自分の uid を含む path への update → 成功。
- 別 uid を含む path への update → CHECK 違反で失敗。

### C. Storage クロスユーザー（`photos` バケット）

- ユーザー A が `<A_uid>/recipe-images/test/x.webp` を upload → 成功。
- ユーザー B が A の path を `createSignedUrl`/download → 拒否。
- バケットが `public=false` のまま。

### D. アプリ非回帰

- ホーム/レシピ/在庫/料理記録が従来どおり表示（新列 null でも崩れない）。
- 既存の料理記録写真・食材スキャン写真が従来どおり表示・アップロードできる。

## open_risks

- 本番/hosted 適用は未実施。Storage policy 誤設定は重大だが既存ポリシー再利用のため新規リスクは低い。
  適用後に C のクロスユーザー拒否を確認すること。
- 実アップロードUI（webp圧縮→upload→path保存→署名URL表示、差し替え時の旧オブジェクト削除）は
  TKT-0174 / TKT-0176 で実装・スモークする。

## 過剰マッチの記録

`csv_import_migration` は `supabase/migrations/` path の `migration` 語による過剰マッチ。
実態は列追加であり CSV/Spreadsheet 移行ではない。
