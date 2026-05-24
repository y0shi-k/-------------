---
id: TKT-0117-unit-conversion-web
title: 単位換算Web移植
status: ready_for_implementation
goal: 単位違いの在庫消費をWeb版でも安全に扱えるようにする
acceptance:
  - 単位換算に必要なschemaまたは保存形式がある
  - 在庫登録/編集で換算情報を設定できる
  - 換算できないケースは手入力へ逃がせる
  - CSV移行に必要な単位換算項目がartifactに残る
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0117/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0117-unit-conversion-web
related_artifacts:
  - artifacts/TKT-0117/verify.json
  - artifacts/TKT-0117/manual-smokes.md
  - artifacts/TKT-0117/review.md
  - artifacts/TKT-0117/report.md
owner_role: implementer
owner_notes:
  - TKT-0116完了後に実施する
  - CSV移行前の必須チケット
---

# Summary

単位換算の保存形式を固めるチケット。
