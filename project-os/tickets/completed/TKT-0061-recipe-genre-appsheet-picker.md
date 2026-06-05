---
id: TKT-0061-recipe-genre-appsheet-picker
title: レシピジャンルのAppSheet風複数選択UI
status: verify_passed
goal: レシピ編集時のジャンル選択を、検索しながら複数項目を連続でON/OFFできる操作に改善する
acceptance:
  - ジャンル欄に選択済みチップと検索入力が同居している
  - 候補ポップオーバーはチェック付き行で、選択済み候補もチェック状態で表示される
  - 候補クリック後もポップオーバーが開いたまま連続選択できる
  - 検索から候補外ジャンルを新規追加できる
  - Esc、外側クリック、空欄Backspace、チップ削除が期待どおり動く
  - verifyコマンドが通る
required_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0061-recipe-genre-appsheet-picker.md
  - project-os/tickets/TKT-0061-recipe-genre-appsheet-picker.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0061-recipe-genre-appsheet-picker
related_artifacts:
  - artifacts/TKT-0061/verify.json
  - artifacts/TKT-0061/manual-smokes.md
  - artifacts/TKT-0061/review.md
  - artifacts/TKT-0061/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 保存形式、Spreadsheetスキーマ、GAS通信パターンは変更しない
  - 書き込み系ではないUI変更のため、個別 `executeGAS(payload...)` を増やさない
---

# Summary

レシピ追加/編集モーダルのジャンル欄を、AppSheet風の検索付きチェック式複数選択UIへ置き換える。

## 実装メモ

- 既存の `r-genres` hidden input と `parseRecipeGenres()` / `serializeRecipeGenres()` は維持する。
- `renderRecipeGenreOptions()` はチップと候補リストの両方を更新する責務にする。
- 候補母集団は初期候補、既存レシピ、現在選択中ジャンルから生成する。
- 新規追加、候補トグル、チップ削除はいずれもhidden inputを更新して再描画する。

## 残リスク

- モバイル幅では選択済みチップが多い場合に入力欄が縦に伸びるため、候補ポップオーバーとの位置関係を手動確認する。
