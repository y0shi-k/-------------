---
id: TKT-0124-cooking-viewer-web
title: 調理ビューアWeb移植
status: completed
goal: 調理中に材料、在庫、手順を確認できるCanvas版ビューアをWeb版へ移す
acceptance:
  - レシピから調理ビューアを開ける
  - 材料/調味料と手順をタブで確認できる
  - 在庫有無が分かる
  - 手順内の材料名を見つけやすい
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0124/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0124-cooking-viewer-web
related_artifacts:
  - artifacts/TKT-0124/verify.json
  - artifacts/TKT-0124/manual-smokes.md
  - artifacts/TKT-0124/review.md
  - artifacts/TKT-0124/report.md
owner_role: implementer
owner_notes:
  - TKT-0123完了後に実施する
---

# Summary

調理ビューアのCanvas版差分を埋めるチケット。
