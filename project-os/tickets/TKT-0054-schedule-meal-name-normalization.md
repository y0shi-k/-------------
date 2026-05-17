---
id: TKT-0054-schedule-meal-name-normalization
title: レシピ詳細スケジュール追加の食事区分正規化
status: ready
goal: レシピ詳細から夕食枠へ追加した献立がスケジュール画面に表示されない問題を解消する
acceptance:
  - レシピ詳細から夕食枠へ追加した献立が、スケジュール画面の晩枠に表示される
  - 既存の `夜` データも晩枠に表示される
  - 新規追加は `晩` として pendingSync に積まれる
  - GAS通信、Spreadsheetスキーマ、pendingSync 構造は変更しない
  - verify がパスする
required_evals:
  - ui_component_adjustment
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0054-schedule-meal-name-normalization.md
  - project-os/tickets/TKT-0054-schedule-meal-name-normalization.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0054-schedule-meal-name-normalization
related_artifacts:
  - artifacts/TKT-0054/verify.json
  - artifacts/TKT-0054/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 表示・保存時の食事区分を `朝` / `昼` / `晩` に揃える
---

# Summary

レシピ詳細モーダルが夕食を `夜` として渡していたため、スケジュール表示側の `晩` 枠に一致せず非表示になっていた。食事区分を正規化し、既存 `夜` データも表示対象にする。
