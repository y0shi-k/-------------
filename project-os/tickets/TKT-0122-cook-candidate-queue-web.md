---
id: TKT-0122-cook-candidate-queue-web
title: 作りたい候補Web移植
status: completed
goal: 作りたい候補キューと理由チップをWeb版へ移す
acceptance:
  - 候補を登録、解除できる
  - 候補理由を表示できる
  - 候補から献立へ追加できる
  - CSV移行に必要な保存形式がartifactに残る
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0122/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0122-cook-candidate-queue-web
related_artifacts:
  - artifacts/TKT-0122/verify.json
  - artifacts/TKT-0122/manual-smokes.md
  - artifacts/TKT-0122/review.md
  - artifacts/TKT-0122/report.md
owner_role: implementer
owner_notes:
  - TKT-0121完了後に実施する
  - CSV移行前の必須チケット
---

# Summary

作りたい候補の保存形式を確定するチケット。
