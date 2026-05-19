---
id: TKT-0065-genre-summary-fallback-render
title: レシピ一覧ジャンル要約の空表示を防ぐ
status: ready_for_user_browser_test
goal: 幅計測タイミングに依存せず、レシピ一覧カードのジャンルが必ず表示されるようにする
acceptance:
  - ジャンル要約コンテナの初期HTMLに最大3件 + `+N` が表示される
  - 幅計測後は可変件数表示に更新される
  - verifyコマンドが通る
required_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0065-genre-summary-fallback-render.md
  - project-os/tickets/TKT-0065-genre-summary-fallback-render.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0065-genre-summary-fallback-render
related_artifacts:
  - artifacts/TKT-0065/verify.json
  - artifacts/TKT-0065/manual-smokes.md
  - artifacts/TKT-0065/review.md
  - artifacts/TKT-0065/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 保存形式、Spreadsheetスキーマ、GAS通信パターンは変更しない
---

# Summary

ジャンル要約の初期表示を空にせず、安全なフォールバックを入れてから幅計測で更新する。
