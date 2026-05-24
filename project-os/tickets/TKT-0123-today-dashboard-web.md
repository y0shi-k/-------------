---
id: TKT-0123-today-dashboard-web
title: 今日ダッシュボードWeb移植
status: completed
goal: 今日の献立、期限、買い物、候補をWeb版でまとめて見られるようにする
acceptance:
  - 今日の献立が見える
  - 期限が近い在庫が見える
  - 未購入の買い物が見える
  - 作りたい候補が見える
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0123/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0123-today-dashboard-web
related_artifacts:
  - artifacts/TKT-0123/verify.json
  - artifacts/TKT-0123/manual-smokes.md
  - artifacts/TKT-0123/review.md
  - artifacts/TKT-0123/report.md
owner_role: implementer
owner_notes:
  - TKT-0122完了後に実施する
---

# Summary

今日ダッシュボードのCanvas版差分を埋めるチケット。
