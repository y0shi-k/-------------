---
id: TKT-0121-meal-schedule-canvas-parity
title: 献立Canvas同等化
status: completed
goal: Canvas版の7日献立、日送り、予定操作をWeb版へ移す
acceptance:
  - 7日分の献立を見られる
  - 日送りができる
  - 予定を追加、削除、移動できる
  - スマホで予定が読みやすい
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0121/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0121-meal-schedule-canvas-parity
related_artifacts:
  - artifacts/TKT-0121/verify.json
  - artifacts/TKT-0121/manual-smokes.md
  - artifacts/TKT-0121/review.md
  - artifacts/TKT-0121/report.md
owner_role: implementer
owner_notes:
  - TKT-0120完了後に実施する
---

# Summary

献立画面のCanvas版差分を埋めるチケット。
