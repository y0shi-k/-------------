---
id: TKT-0064-dynamic-genre-summary-tooltip
title: レシピ一覧ジャンルの可変件数表示と即時ツールチップ
status: ready_for_user_browser_test
goal: レシピ一覧カードの空き幅を有効活用し、省略ジャンルをすぐ確認できるようにする
acceptance:
  - ジャンル表示件数が3件固定ではなくカード内の空き幅に応じて変わる
  - 空き幅があれば4件以上のジャンルも表示される
  - 入り切らない分だけ `+N` にまとめられる
  - `+N` hoverで省略ジャンルのツールチップが即時表示される
  - verifyコマンドが通る
required_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0064-dynamic-genre-summary-tooltip.md
  - project-os/tickets/TKT-0064-dynamic-genre-summary-tooltip.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0064-dynamic-genre-summary-tooltip
related_artifacts:
  - artifacts/TKT-0064/verify.json
  - artifacts/TKT-0064/manual-smokes.md
  - artifacts/TKT-0064/review.md
  - artifacts/TKT-0064/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 保存形式、Spreadsheetスキーマ、GAS通信パターンは変更しない
  - ブラウザ実操作確認はユーザー実施
---

# Summary

レシピ一覧カードのジャンル要約を、固定3件ではなく実際の表示幅に合わせて可変表示する。`+N` は独自ツールチップで即時表示する。

## 実装メモ

- `renderRecipeListGenreSummary()` は全ジャンルを `data-genres` に保持するコンテナを返す。
- `fitRecipeListGenreSummaries()` が各コンテナ幅を測り、収まる最大件数を描画する。
- `+N` は `title` ではなく `data-tooltip` と `mouseenter` / `mouseleave` で制御する。
- `renderRecipeList()` 後と `resize` 後に再計算する。

## 残リスク

- 実幅計測はブラウザレイアウト依存のため、Canvas上での最終見た目確認が必要。
