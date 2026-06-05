---
id: TKT-0119-recipe-collection-canvas-parity
title: レシピ集Canvas同等化
status: completed
goal: レシピ集の検索、ソート、削除、ジャンル選択、編集UIをCanvas版に近づける
acceptance:
  - レシピ検索とソートができる
  - レシピ削除が安全にできる
  - ジャンルを複数選択しやすい
  - 材料/調味料/手順の順序を扱いやすい
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0119/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0119-recipe-collection-canvas-parity
related_artifacts:
  - artifacts/TKT-0119/verify.json
  - artifacts/TKT-0119/manual-smokes.md
  - artifacts/TKT-0119/review.md
  - artifacts/TKT-0119/report.md
owner_role: implementer
owner_notes:
  - TKT-0118完了後に実施する
---

# Summary

レシピ集のCanvas版差分を埋めるチケット。
