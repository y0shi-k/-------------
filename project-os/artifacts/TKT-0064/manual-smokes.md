---
ticket_id: TKT-0064-dynamic-genre-summary-tooltip
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

- レシピ集一覧カードのジャンル可変件数表示
- `+N` 省略チップの即時ツールチップ

## executed_checks

- 実ブラウザでの操作確認はユーザー実施予定。
- 実装側では標準verify、JavaScript構文チェック、ネイティブダイアログ/通信パターン静的確認を実施済み。

## user_check_steps

- ジャンルが多いレシピで、空き幅がある場合に3件固定ではなく4件以上表示されることを確認する。
- 画面幅を変えた時、表示されるジャンル件数と `+N` 件数が再計算されることを確認する。
- `+N` にマウスを乗せた瞬間、省略ジャンルのツールチップが遅延なく表示されることを確認する。
- `+N` からマウスを外したらツールチップが閉じることを確認する。

## skipped_checks

- 実ブラウザ操作はユーザー依頼により未実施。
- 実Spreadsheet同期は保存形式・GAS通信を変更していないため対象外。

## open_risks

- 実幅計算はCanvasの実レイアウトに依存するため、最終表示はCanvas上で確認する。
