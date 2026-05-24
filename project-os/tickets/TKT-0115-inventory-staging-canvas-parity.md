---
id: TKT-0115-inventory-staging-canvas-parity
title: 在庫・登録待ちCanvas同等化
status: ready_for_implementation
goal: 在庫一覧と登録待ちの操作をCanvas版と同等に近づける
acceptance:
  - 在庫を保存場所、期限、種別で探しやすい
  - 使い切り、編集、削除、一括選択がスマホで扱える
  - 登録待ちを一括削除できる
  - 写真AI解析から登録待ち、在庫確定まで既存導線が壊れない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - photo_upload_storage
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0115/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0115-inventory-staging-canvas-parity
related_artifacts:
  - artifacts/TKT-0115/verify.json
  - artifacts/TKT-0115/manual-smokes.md
  - artifacts/TKT-0115/review.md
  - artifacts/TKT-0115/report.md
owner_role: implementer
owner_notes:
  - TKT-0114完了後に実施する
  - 保存場所マスタ管理はTKT-0116で扱う
  - 単位換算はTKT-0117で扱う
---

# Summary

在庫と登録待ちのCanvas版差分を埋めるチケット。
