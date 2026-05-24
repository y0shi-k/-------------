---
id: TKT-0116-storage-location-management-web
title: 保存場所管理Web移植
status: ready_for_implementation
goal: Canvas版の保存場所追加/削除/在庫あり制御をWeb版へ移す
acceptance:
  - 保存場所を管理できる
  - 使用中の保存場所を誤って消せない
  - 在庫/登録待ちフォームで保存場所を選びやすい
  - CSV移行に必要な保存場所の扱いがartifactに残る
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0116/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0116-storage-location-management-web
related_artifacts:
  - artifacts/TKT-0116/verify.json
  - artifacts/TKT-0116/manual-smokes.md
  - artifacts/TKT-0116/review.md
  - artifacts/TKT-0116/report.md
owner_role: implementer
owner_notes:
  - TKT-0115完了後に実施する
  - schemaを変える場合はRLSを必ず確認する
---

# Summary

保存場所をCSV移行前に確定するためのチケット。
