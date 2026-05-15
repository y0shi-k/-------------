# TKT-0014 Report

## Summary

献立スケジュールの表示を初期同期済み `state.schedule` の再描画に変更し、タブを押すたびの献立GAS読込を止めた。献立レシピ選択モーダルでは、レシピ本体クリックを既存レシピ編集画面の表示に変更し、献立反映は「献立に追加」ボタンに分離した。

## Changed

- `handleInit()` が `献立スケジュール` シートも読み込み、`state.schedule` に保持する。
- `switchBTab('schedule')` は `renderSchedule()` のみ実行する。
- レシピ編集モーダルをレシピ選択モーダルより前面に表示する。
- レシピ選択行に「献立に追加」ボタンを追加し、行本体クリックで `openRecipeEditor()` を開く。

## Verify

- `VERIFY_PASSED`
- 静的確認で、scheduleタブ切替から `loadSchedule()` が外れていることを確認。
- 静的確認で、新規の個別書き込み `executeGAS(payload...)` が増えていないことを確認。
