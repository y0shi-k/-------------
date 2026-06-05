---
id: TKT-0056-schedule-card-action-menu
title: スケジュール献立カードの開始導線と削除確認
status: implementation_ready
goal: スケジュール献立カード内の開始ボタンを削除し、操作メニューへ調理開始と削除確認を集約する
acceptance:
  - スケジュール画面で献立カードに開始ボタンが表示されない
  - 献立カードクリックで操作メニューが開き、調理を開始、別のレシピに変更、削除するが表示される
  - 調理を開始で openCookingViewer(recipeId, { returnTo: 'schedule' }) が呼ばれる
  - 削除するで専用確認モーダルが開き、キャンセルでは削除されない
  - 確認後だけ queueScheduleDelete() 経由で pendingSync に積まれる
  - alert / confirm / prompt を使わない
  - verify が PASS する
required_evals:
  - ui_component_adjustment
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0056-schedule-card-action-menu.md
  - project-os/tickets/TKT-0056-schedule-card-action-menu.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0056-schedule-card-action-menu
related_artifacts:
  - artifacts/TKT-0056/verify.json
  - artifacts/TKT-0056/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 単体削除は完了済みかどうかに関係なく確認モーダルを表示する
---

# Summary

スケジュール献立カードの開始ボタンをなくし、カードクリック後の操作メニューに調理開始を追加する。削除は即時実行せず確認後に既存の pendingSync 経路へ載せる。
