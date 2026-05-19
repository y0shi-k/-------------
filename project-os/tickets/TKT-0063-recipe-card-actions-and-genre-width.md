---
id: TKT-0063-recipe-card-actions-and-genre-width
title: レシピ一覧カードのボタンを1行目へ移動しジャンル幅を広げる
status: ready_for_user_browser_test
goal: レシピ一覧でジャンルチップの文字が省略されすぎる表示を改善する
acceptance:
  - 右側の3操作ボタンがカード1行目の右端に表示される
  - 2行目のジャンル表示が現状より広くなり、チップ文字が読める
  - ジャンルの最大3件 + `+N` 要約は維持される
  - verifyコマンドが通る
required_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0063-recipe-card-actions-and-genre-width.md
  - project-os/tickets/TKT-0063-recipe-card-actions-and-genre-width.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0063-recipe-card-actions-and-genre-width
related_artifacts:
  - artifacts/TKT-0063/verify.json
  - artifacts/TKT-0063/manual-smokes.md
  - artifacts/TKT-0063/review.md
  - artifacts/TKT-0063/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 保存形式、Spreadsheetスキーマ、GAS通信パターンは変更しない
  - ブラウザ実操作確認はユーザー実施
---

# Summary

レシピ一覧カードの操作ボタン群をタイトル行へ移動し、2行目のジャンル要約表示幅を広げる。

## 実装メモ

- `renderRecipeListGenreSummary()` の最大幅制限を緩め、残り幅を使うレイアウトにする。
- `renderRecipeList()` のカードHTMLから外側右カラムの操作ボタン群を取り除き、タイトル行右側へ移す。
- カード全体は2行構成を維持する。

## 残リスク

- 極端に狭い幅ではレシピ名またはメタ情報の省略量が増えるため、Canvas上で確認する。
