---
id: TKT-0053-schedule-bulk-delete-placement
title: スケジュール一括削除ボタンの上部配置
status: ready
goal: スケジュール選択時の一括削除ボタンを下部から上部の小型ボタンへ移動する
acceptance:
  - スケジュール選択モードで1件以上選択すると、上部右側に小型の「選択削除」ボタンが表示される
  - スケジュール下部の大きな一括削除ボタンは表示されない
  - 未選択時は上部の削除ボタンが表示されない
  - 既存の削除確認・pendingSync 経路は維持される
  - verify がパスする
required_evals:
  - ui_component_adjustment
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0053-schedule-bulk-delete-placement.md
  - project-os/tickets/TKT-0053-schedule-bulk-delete-placement.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0053-schedule-bulk-delete-placement
related_artifacts:
  - artifacts/TKT-0053/verify.json
  - artifacts/TKT-0053/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - `batchDeleteSchedule()` と削除確認モーダルは再利用する
---

# Summary

スケジュール画面の下部一括削除ボタンを廃止し、選択モード行の右側に小型削除ボタンとして表示する。
