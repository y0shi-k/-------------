---
ticket_id: TKT-0061-recipe-genre-appsheet-picker
status: passed
execution_mode: automated_headless_browser
target_evals:
  - ui_component_addition
  - verify_html_valid
  - verify_showtoast_exists
  - verify_no_native_dialogs
---

# Manual Smokes

## target_evals

- レシピ追加/編集モーダルのジャンル欄UI
- AppSheet風の検索付きチェック式複数選択挙動

## executed_checks

- ローカルChromeのheadless実ブラウザで `file://app.html` を開き、`openRecipeEditor(null)` でレシピ追加モーダルを表示した。
- ジャンル検索入力をクリックすると候補ポップオーバーが開くことを確認した。
- 候補の `和食` と `中華` をクリックし、`r-genres` が `["和食","中華"]` になり、ポップオーバーが開いたまま残ることを確認した。
- 検索入力に `発酵` を入れて Enter し、候補外ジャンルとして `["和食","中華","発酵"]` に追加されることを確認した。
- 入力欄が空の状態で Backspace し、最後のジャンル `発酵` が外れることを確認した。
- Esc でポップオーバーが閉じることを確認した。
- pageerror は発生しなかった。

## skipped_checks

- Gemini Canvas 上での手動貼り付け確認は未実施。
- 実Spreadsheet同期は保存形式・GAS通信を変更していないため対象外。

## open_risks

- 選択済みジャンルが多い場合のモバイル表示は、実機/Canvasでの見た目確認余地がある。
