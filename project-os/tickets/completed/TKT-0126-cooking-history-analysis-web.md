---
id: TKT-0126-cooking-history-analysis-web
title: 料理履歴分析Web移植
status: completed
goal: 料理履歴のタイムライン、カレンダー、分析、検索、フィルタをWeb版へ移す
acceptance:
  - 履歴をタイムラインで見られる
  - カレンダー表示がある
  - 分析表示がある
  - 検索/フィルタができる
  - 写真が非公開Storageのまま表示される
  - Web版verifyが通る
required_evals:
  - photo_upload_storage
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0126/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0126-cooking-history-analysis-web
related_artifacts:
  - artifacts/TKT-0126/verify.json
  - artifacts/TKT-0126/manual-smokes.md
  - artifacts/TKT-0126/review.md
  - artifacts/TKT-0126/report.md
owner_role: implementer
owner_notes:
  - TKT-0125完了後に実施する
---

# Summary

料理履歴のCanvas版差分を埋めるチケット。
