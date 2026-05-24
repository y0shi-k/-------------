---
id: TKT-0131-inventory-workspace-visual-parity
title: 食材管理画面Canvas表示寄せ
status: ready_for_spec_review
goal: Web版の食材管理、買い物リスト、登録待ちをCanvas版と同じ場所で操作できる画面に近づける
acceptance:
  - 保存場所タブ、使い切り、在庫カード操作が食材管理画面で見つけやすい
  - 買い物リストで手動追加、購入済み、一括削除の入口が見える
  - 登録待ちで画像スキャン、手動追加、AI解析、在庫追加の入口が整理されている
  - スマホで横スクロールやボタン密集が破綻しない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0131/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0131-inventory-workspace-visual-parity
related_artifacts:
  - artifacts/TKT-0131/verify.json
  - artifacts/TKT-0131/manual-smokes.md
  - artifacts/TKT-0131/review.md
  - artifacts/TKT-0131/report.md
owner_role: implementer
owner_notes:
  - TKT-0130完了後に実施する
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - 既存保存処理を変更する場合は、RLSと非公開Storageの影響を必ず確認する
---

# Summary

食材管理まわりを画面単位でCanvas版へ寄せるチケット。
