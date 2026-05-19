---
ticket_id: TKT-0063-recipe-card-actions-and-genre-width
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

- レシピ集一覧カードの操作ボタン配置
- レシピ集一覧カードのジャンル表示幅

## executed_checks

- 実ブラウザでの操作確認はユーザー実施予定。
- 実装側では標準verify、JavaScript構文チェック、ネイティブダイアログ/通信パターン静的確認を実施済み。

## user_check_steps

- ジャンルが複数あるレシピ一覧カードで、料理する・編集・削除ボタンが1行目右側に表示されることを確認する。
- 2行目の登録日の右側で、ジャンルチップの文字が前回より読める幅になっていることを確認する。
- ジャンルが4件以上ある場合、最大3件 + `+N` の要約表示が維持されることを確認する。
- カードクリック、料理する、編集、削除のクリック領域が期待どおり分離していることを確認する。

## skipped_checks

- 実ブラウザ操作はユーザー依頼により未実施。
- 実Spreadsheet同期は保存形式・GAS通信を変更していないため対象外。

## open_risks

- 狭い幅ではタイトルの省略量が増える可能性があるため、Canvas実機で確認する。
