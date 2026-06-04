---
id: TKT-0173-user-image-schema-and-storage
title: ユーザー登録画像のDB/Storage基盤（レシピ・食材共通）
status: implementation_ready
goal: レシピ画像・食材画像をユーザーが安全に登録できるよう、DB列とStorage権限の共通基盤を作る
acceptance:
  - `recipes` にユーザー登録画像のStorage path列が追加される
  - `inventory_items` にユーザー登録画像のStorage path列が追加される
  - 画像Storage pathは本人の領域に限定され、公開URLをDBに保存しない
  - Storage policy / RLS が本人限定であることを確認する
  - 既存データは画像なしで維持され、削除・上書きされない
  - 既存の料理記録写真・食材スキャン写真を壊さない
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/
  - web/src/lib/
  - project-os/artifacts/TKT-0173-user-image-schema-and-storage/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0173-user-image-schema-and-storage
related_artifacts:
  - artifacts/TKT-0173-user-image-schema-and-storage/verify.json
  - artifacts/TKT-0173-user-image-schema-and-storage/manual-smokes.md
  - artifacts/TKT-0173-user-image-schema-and-storage/review.md
  - artifacts/TKT-0173-user-image-schema-and-storage/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0172完了。TKT-0174/0176の前提チケット。
  - 本番DB・Supabase Dashboardへの適用は明示依頼がある場合だけ行う。通常はmigrationファイル作成とverifyまで。
  - Storageは非公開前提。公開バケット・公開URL保存は禁止。
  - Service Role keyをブラウザへ出さない。APIキー・秘密鍵を直書きしない。
  - 既存 `photos` バケットを再利用するか新規バケットにするかは、実装時に既存migrationを確認して判断し、理由をreportへ記録する。
  - Canvas版 `app.html` は触らない。
---

# Summary

レシピ画像・食材画像の正式登録機能の土台として、DB列とStorage権限を整える。UIは後続チケットで実装する。

## 実装メモ

- `recipes.image_storage_path` 相当の列を追加する。
- `inventory_items.image_storage_path` 相当の列を追加する。
- Storage pathは `<user_id>/recipe-images/...` と `<user_id>/inventory-images/...` のように本人配下へ寄せる。
- 署名付きURLで表示する前提にし、公開URLは保存しない。
- migration後、既存データは `null` のまま維持する。

## 検証メモ

- `/verify TKT-0173-user-image-schema-and-storage`
- Storage policy / RLS の静的確認を `manual-smokes.md` / `review.md` に残す。

## 残リスク

- 写真は個人情報を含む可能性があるため、policyミスは重大。review必須。
