---
id: TKT-0125-cooking-completion-consumption-web
title: 調理完了と在庫消費Web移植
status: ready_for_implementation
goal: 調理完了時に消費量調整、代替品選択、在庫減算、履歴作成を安全に行う
acceptance:
  - 調理完了前に消費量を確認/調整できる
  - 代替品を選べる
  - 在庫がSupabase上で減算される
  - 料理履歴が作られる
  - CSV移行に必要な消費関連項目がartifactに残る
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0125/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0125-cooking-completion-consumption-web
related_artifacts:
  - artifacts/TKT-0125/verify.json
  - artifacts/TKT-0125/manual-smokes.md
  - artifacts/TKT-0125/review.md
  - artifacts/TKT-0125/report.md
owner_role: implementer
owner_notes:
  - TKT-0124完了後に実施する
  - CSV移行前の必須チケット
  - TKT-0117の単位換算方針を使う
---

# Summary

調理完了と在庫消費のCanvas版差分を埋めるチケット。
