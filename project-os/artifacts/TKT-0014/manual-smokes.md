# TKT-0014 Manual Smokes

## 実施状況

- この環境では Gemini Canvas プレビューと実GAS通信の手動操作は未実施。
- コード上の静的確認とHTML構文verifyは実施済み。

## 確認済み

- `switchBTab('schedule')` は `loadSchedule()` を呼ばず、`renderSchedule()` のみ実行する。
- `changeScheduleWeek(delta)` は既存どおり `renderSchedule()` のみで、週切替時のGAS通信を追加していない。
- レシピ選択モーダルの行本体は `openRecipeEditor(recipe.id)` を呼ぶ。
- 献立反映は行内の「献立に追加」ボタンだけが `assignScheduleRecipe(...)` を呼ぶ。
- 新規の個別書き込み `executeGAS(payload...)` は追加していない。

## Canvasで確認する項目

- 初期同期後、献立スケジュールタブを複数回押しても「献立スケジュールを読み込み中...」が出ない。
- 前の週/次の週でGAS通信ローディングが出ない。
- レシピ選択モーダルでレシピ行を押すと、材料と手順が入った既存のレシピ編集画面が前面に開く。
- レシピ編集画面を閉じた後、レシピ選択モーダルに戻り、「献立に追加」でのみ献立が反映される。
