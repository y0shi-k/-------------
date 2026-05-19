---
ticket_id: TKT-0062-recipe-list-genre-layout-and-order
status: pending_user_browser
execution_mode: user_browser_test
target_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
---

# Manual Smokes

## target_evals

- レシピ集一覧カードの2行固定表示
- ジャンル要約表示（最大3件 + `+N`）
- レシピ編集画面の選択済みジャンルD&D

## executed_checks

- 実ブラウザでの操作確認はユーザー実施予定。
- 実装側では標準verify、JavaScript構文チェック、ネイティブダイアログ/通信パターン静的確認を実施済み。

## user_check_steps

- ジャンルが4件以上あるレシピを一覧で表示し、1行目にジャンルが出ず、2行目の登録日の右側に最大3件 + `+N` で表示されることを確認する。
- `+N` の件数が省略されたジャンル数と一致することを確認する。
- レシピ編集画面で選択済みジャンルチップをドラッグし、順序が入れ替わることを確認する。
- 更新保存後、一覧のジャンル表示順が編集画面の順序に従うことを確認する。
- ジャンル追加/削除後も保存形式と一覧表示が壊れないことを確認する。

## skipped_checks

- 実ブラウザ操作はユーザー依頼により未実施。
- 実Spreadsheet同期は保存形式・GAS通信を変更していないため対象外。

## open_risks

- HTML5 D&D のタッチ端末挙動はブラウザ依存。
- 狭い幅での `+N` 表示位置はCanvas実機で確認が必要。
