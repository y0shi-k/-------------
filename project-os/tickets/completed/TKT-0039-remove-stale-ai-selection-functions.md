---
id: TKT-0039-remove-stale-ai-selection-functions
title: 未使用AI選択関数の削除
status: implementation_ready
goal: 旧AI食材選択関数と存在しないDOM参照を取り除く
acceptance:
  - `clearAiSelection()` の参照・定義がない
  - `updateAiSelectedTags()` の参照・定義がない
  - `aiSelectedTagsList` 参照がない
  - 既存verifyが通る
required_evals:
  - static_cleanup
  - static_verify
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0039-remove-stale-ai-selection-functions.md
  - project-os/tickets/TKT-0039-remove-stale-ai-selection-functions.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0039-remove-stale-ai-selection-functions
related_artifacts:
  - artifacts/TKT-0039/verify.json
  - artifacts/TKT-0039/manual-smokes.md
  - artifacts/TKT-0039/review.md
  - artifacts/TKT-0039/report.md
owner_role: implementer
owner_notes:
  - Spreadsheet書き込みは変更しない
---

# Summary

現行UIから使われていない旧AI食材選択関数を削除する。
