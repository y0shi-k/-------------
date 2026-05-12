---
id: TKT-0000-example
title: 実装タスクのタイトル
status: draft
goal: 何を防ぐための変更か
acceptance:
  - 完了条件1
required_evals:
  - example_eval
eval_selection_mode: auto
changed_paths:
  - {{SOURCE_OF_TRUTH_PATHS}}
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0000-example
related_artifacts:
  - artifacts/TKT-0000-example/verify.json
  - artifacts/TKT-0000-example/manual-smokes.md
  - artifacts/TKT-0000-example/review.md
  - artifacts/TKT-0000-example/report.md
owner_role: implementer
owner_notes:
  - verify は `{{VERIFY_COMMAND}}`
  - 任意監査は `{{OPTIONAL_AUDIT_COMMAND}}`
---

# Summary

`required_evals` は `harness/change_evals.json` の `match_rules` と変更範囲を根拠に決める。

## 実装メモ

- プロジェクト名: `{{PROJECT_NAME}}`
- 正本: `{{SOURCE_OF_TRUTH_PATHS}}`
- 生成物: `{{GENERATED_FILES}}`
- stack 固有 eval: `{{STACK_SPECIFIC_EVALS}}`

## 残リスク
