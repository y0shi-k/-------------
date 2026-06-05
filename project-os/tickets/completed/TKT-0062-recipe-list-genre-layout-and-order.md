---
id: TKT-0062-recipe-list-genre-layout-and-order
title: レシピ一覧ジャンル表示の2行固定化とジャンル並び替え
status: ready_for_user_browser_test
goal: ジャンルが多いレシピでも一覧カードの高さが増えないようにし、表示優先順を編集画面で調整できるようにする
acceptance:
  - レシピ集一覧カードのジャンルが1行目ではなく2行目の登録日の右側に表示される
  - 一覧カードの情報表示は2行構成で、ジャンルが多くてもカード高さが増えない
  - ジャンルは最大3件表示、4件目以降は `+N` に要約される
  - 編集画面の選択済みジャンルチップをD&Dで並び替えられる
  - 並び替え後の順序が保存時の `genre` JSON配列順に反映される
  - verifyコマンドが通る
required_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0062-recipe-list-genre-layout-and-order.md
  - project-os/tickets/TKT-0062-recipe-list-genre-layout-and-order.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0062-recipe-list-genre-layout-and-order
related_artifacts:
  - artifacts/TKT-0062/verify.json
  - artifacts/TKT-0062/manual-smokes.md
  - artifacts/TKT-0062/review.md
  - artifacts/TKT-0062/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 保存形式、Spreadsheetスキーマ、GAS通信パターンは変更しない
  - ブラウザ実操作確認はユーザー実施。実装側は静的verifyと手順記録を残す
---

# Summary

レシピ一覧カードのジャンル表示を2行目へ移動し、多いジャンルは要約する。編集画面では選択済みジャンルチップをD&Dで並び替えられるようにする。

## 実装メモ

- 一覧用のジャンル要約ヘルパーを追加し、先頭3件と残件数を描画する。
- `renderRecipeList()` のカードHTMLを、タイトル行とメタ情報+ジャンル行の2行構成へ変更する。
- 選択済みジャンルチップに `data-genre` と `draggable` を付与し、ジャンル専用D&Dで `r-genres` を更新する。
- 既存の材料/工程D&Dと同じHTML5 Drag and Drop APIを使う。

## 残リスク

- タッチデバイスでのHTML5 D&Dはブラウザ実装に依存する。
- 実際のCanvas表示で、狭い幅の `+N` チップ位置はユーザー確認が必要。
