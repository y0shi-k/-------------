---
id: TKT-0114-web-canvas-mode-navigation
title: Web版Canvas同等ナビとステータス
status: ready_for_implementation
goal: Web版をCanvas版と同じ主モード構成に寄せ、スマホで迷わず操作できる土台を作る
acceptance:
  - 食材管理、献立・レシピ、料理・記録を主モードとして切り替えられる
  - スマホ下部ナビまたは同等の固定ナビがある
  - 処理中、成功、失敗、AI処理の状態表示が見失われない
  - 既存の在庫、レシピ、献立、履歴機能が使える
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0114/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0114-web-canvas-mode-navigation
related_artifacts:
  - artifacts/TKT-0114/verify.json
  - artifacts/TKT-0114/manual-smokes.md
  - artifacts/TKT-0114/review.md
  - artifacts/TKT-0114/report.md
owner_role: implementer
owner_notes:
  - TKT-0113の監査結果に基づく完全一致チケット
  - 機能追加より、以後の実装先になる画面構造を優先する
---

# Summary

Canvas版の3モード体験に合わせるためのWeb版ナビ土台チケット。
