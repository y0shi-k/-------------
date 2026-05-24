---
id: TKT-0133-cooking-record-workspace-visual-parity
title: 料理・記録画面Canvas表示寄せ
status: ready_for_spec_review
goal: Web版の料理・記録モードをCanvas版と同じ今日/調理/履歴の流れで使える画面へ近づける
acceptance:
  - `料理・記録` から今日の確認、調理開始、料理履歴へ進みやすい
  - 調理ビューアで材料、調味料、手順、在庫状態が見やすい
  - 調理完了時の在庫消費、代替品、料理記録、履歴保存の流れが分かる
  - 履歴のタイムライン、カレンダー、振り返りの入口が整理されている
  - 写真URLや秘密鍵を公開しない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0133/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0133-cooking-record-workspace-visual-parity
related_artifacts:
  - artifacts/TKT-0133/verify.json
  - artifacts/TKT-0133/manual-smokes.md
  - artifacts/TKT-0133/review.md
  - artifacts/TKT-0133/report.md
owner_role: implementer
owner_notes:
  - TKT-0132完了後に実施する
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - 写真表示は署名付きURLなど既存の非公開Storage方針を維持する
---

# Summary

料理・記録を画面単位でCanvas版へ寄せるチケット。
