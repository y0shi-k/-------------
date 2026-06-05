---
id: TKT-0014-schedule-cache-and-recipe-preview
title: 献立スケジュールの通信削減とレシピ確認導線
status: ready
goal: 献立スケジュールタブの不要なGAS通信を減らし、献立追加前にレシピ内容を確認できるようにする
acceptance:
  - 初期DB同期で献立スケジュールを state.schedule に読み込む
  - schedule タブ切替で loadSchedule() を呼ばず renderSchedule() だけを行う
  - レシピ選択モーダルのレシピ本体クリックで既存のレシピ編集画面が開く
  - 献立追加は専用ボタン押下時だけ行われる
  - 書き込み系の即時GAS通信が増えない
  - verify がパスする
required_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
  - ui_component_adjustment
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0014-schedule-cache-and-recipe-preview.md
  - project-os/tickets/TKT-0014-schedule-cache-and-recipe-preview.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0014-schedule-cache-and-recipe-preview
related_artifacts:
  - artifacts/TKT-0014/verify.json
  - artifacts/TKT-0014/manual-smokes.md
  - artifacts/TKT-0014/review.md
  - artifacts/TKT-0014/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 献立の追加/変更/削除は state.pendingSync.scheduleCreates / scheduleDeletes 経由のまま
  - 新規の個別 executeGAS(payload...) 書き込みを増やさない
---

# Summary

初期同期に献立スケジュール読込を含め、献立タブ表示はローカル状態の再描画にする。レシピ選択モーダルではレシピ本体を確認導線、「献立に追加」ボタンを割り当て導線として分離する。
