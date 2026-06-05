---
id: TKT-0082-scheduled-completion-date-preservation
title: 予定日からの料理完了日付保持
status: implementation_ready
goal: 料理記録カレンダーの過去予定を後日完了しても、料理履歴が完了当日ではなく予定日に残るようにする
acceptance:
  - 2026-05-21 の未完了予定を 2026-05-22 に料理記録カレンダーから完了した場合、履歴は 2026-05-21 に追加される
  - 同ケースで 2026-05-22 のカレンダーセルには履歴が追加されない
  - スケジュール更新は `state.pendingSync.scheduleUpdates` に積まれ、予定日は書き換わらない
  - 予定なしの直接調理は完了当日の日付で履歴に残る
  - verify がパスする
required_evals:
  - bug_fix
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0082-scheduled-completion-date-preservation.md
  - project-os/tickets/TKT-0082-scheduled-completion-date-preservation.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0082-scheduled-completion-date-preservation
related_artifacts:
  - artifacts/TKT-0082/verify.json
  - artifacts/TKT-0082/manual-smokes.md
  - artifacts/TKT-0082/review.md
  - artifacts/TKT-0082/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - `executeGAS(payload...)` の新規書き込みを追加しない
  - alert/confirm/prompt は使用しない
---

# Summary

`completeRecipe()` が常に完了操作日の `todayStr` で料理履歴を作成していたため、過去予定の後日完了が当日カレンダーに残っていた。予定IDでスケジュールを特定できた場合は、予定日を料理履歴・レシピ履歴の日付として使う。
