---
ticket_id: TKT-0065-genre-summary-fallback-render
status: pending_user_browser
execution_mode: user_browser_test
target_evals:
  - ui_component_addition
  - verify_html_valid
---

# Manual Smokes

## executed_checks

- 実ブラウザでの操作確認はユーザー実施予定。
- 実装側では標準verifyとJavaScript構文チェックを実施済み。

## user_check_steps

- レシピ一覧を開いた直後にジャンルチップが表示されることを確認する。
- 表示直後は最低でも最大3件 + `+N` が見えることを確認する。
- 少し待つ/画面幅を変えると、空き幅に応じて4件以上も表示されることを確認する。

## open_risks

- Canvas上の実幅に応じた可変表示はユーザー確認が必要。
