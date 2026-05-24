---
id: TKT-0127-delete-confirmation-web
title: Web版削除確認統一
status: completed
goal: Web版の削除操作をCanvas版同様に安全な確認UIへ統一する
acceptance:
  - 削除前に統一された確認UIが出る
  - 在庫、登録待ち、買い物、レシピ、献立、履歴の削除が対象になる
  - ブラウザ標準confirmに頼らない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0127/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0127-delete-confirmation-web
related_artifacts:
  - artifacts/TKT-0127/verify.json
  - artifacts/TKT-0127/manual-smokes.md
  - artifacts/TKT-0127/review.md
  - artifacts/TKT-0127/report.md
owner_role: implementer
owner_notes:
  - TKT-0126完了後に実施する
---

# Summary

削除確認のCanvas版差分を埋めるチケット。
