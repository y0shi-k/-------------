---
id: TKT-0052-recipe-detail-schedule-return
title: レシピ詳細からのスケジュール追加後表示修正
status: ready
goal: レシピ詳細から追加した献立が画面上で追加されていないように見える問題を解消する
acceptance:
  - レシピ詳細からスケジュール追加後、追加した日付を含むスケジュール週が表示される
  - スケジュールの + ボタン経由の追加挙動は変わらない
  - GAS通信、Spreadsheetスキーマ、pendingSync 構造は変更しない
  - verify がパスする
required_evals:
  - ui_component_adjustment
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0052-recipe-detail-schedule-return.md
  - project-os/tickets/TKT-0052-recipe-detail-schedule-return.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0052-recipe-detail-schedule-return
related_artifacts:
  - artifacts/TKT-0052/verify.json
  - artifacts/TKT-0052/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 既存の `assignScheduleFromViewer()` の表示復帰だけを修正する
---

# Summary

レシピ詳細からスケジュール追加した後、追加済みの献立を見える状態にする。スプシへは追加されているため、保存処理ではなく画面復帰と再描画を修正する。
