---
id: TKT-0118-shopping-list-canvas-parity
title: 買い物リストCanvas同等化
status: completed
goal: 買い物リストの手動追加、購入済み、一括操作、出自別表示をWeb版へ移す
acceptance:
  - 買い物を手動追加できる
  - 購入済みにできる
  - 選択して一括削除できる
  - 献立由来/手動など出自が分かる
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0118/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0118-shopping-list-canvas-parity
related_artifacts:
  - artifacts/TKT-0118/verify.json
  - artifacts/TKT-0118/manual-smokes.md
  - artifacts/TKT-0118/review.md
  - artifacts/TKT-0118/report.md
owner_role: implementer
owner_notes:
  - TKT-0117完了後に実施する
---

# Summary

買い物リストのCanvas版差分を埋めるチケット。
