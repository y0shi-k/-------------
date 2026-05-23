---
id: TKT-0103-supabase-schema-v1
title: Supabase schema v1
status: ready_for_implementation
goal: Web版で使うDB/Storageの土台をmigrationとして定義する
acceptance:
  - `supabase/` にmigrationがある
  - `inventory_items`, `staging_items`, `shopping_items`, `recipes`, `recipe_ingredients`, `meal_schedules`, `cooking_history`, `photos` 相当が定義されている
  - 個人データを持つテーブルでRLSが有効
  - 本人だけ読める/書けるpolicyがある
  - 写真Storageが非公開前提になっている
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
eval_selection_mode: manual
changed_paths:
  - supabase/
  - project-os/artifacts/TKT-0103/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0103-supabase-schema-v1
related_artifacts:
  - artifacts/TKT-0103/verify.json
  - artifacts/TKT-0103/manual-smokes.md
  - artifacts/TKT-0103/review.md
  - artifacts/TKT-0103/report.md
owner_role: implementer
owner_notes:
  - TKT-0102完了後に実施する
  - schemaは後続機能の基盤なので、列名と型をREADMEまたはmigrationコメントで追えるようにする
  - 完了後は TKT-0104 に進む
---

# Summary

Supabaseのデータ設計チケット。以後の画面実装が迷わないよう、主要テーブルとRLSを先に固定する。

## 実装メモ

- `user_id` を持つ設計を基本にする。
- 写真はStorage pathとメタ情報をDBに分ける。
- レシピ材料はJSON一括保存より、検索・移行しやすい形を優先する。

## 次

TKT-0104-auth-self-user
