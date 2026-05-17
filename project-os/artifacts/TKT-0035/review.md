# Review

## 変更対象ファイル

- `app.html`（のみ）

## 変更箇所概要

1. **HTML構造追加**
   - `scheduleRecipeModal` にソートボタン行を追加（名前・追加日・前回調理・調理回数）
   - `aiRecipePreviewModal` の `recipeViewActions` に「スケジュールに追加」ボタンを追加
   - 新規 `scheduleAddModal`（ミニカレンダー＋食事選択）を追加

2. **state 拡張**
   - `scheduleRecipePickerSortBy` / `scheduleRecipePickerSortOrder`
   - `_scheduleAddRecipeId` / `_scheduleAddRecipeName` / `_scheduleAddSelectedDate`

3. **JavaScript関数追加**
   - `setScheduleRecipePickerSort(key)`: ソート切り替え
   - `renderScheduleRecipePickerList()`: 検索拡張（材料名含む）＋ソート対応に書き換え
   - `openScheduleAddFromViewer()`: レシピ詳細から追加モーダルを開く
   - `openScheduleAddModal(recipeId)` / `closeScheduleAddModal()`: ミニカレンダー制御
   - `renderScheduleAddCalendar()`: 30日分カレンダー描画
   - `selectScheduleAddDate(date, el)`: 日付選択ハイライト
   - `assignScheduleFromViewer(meal)`: 食事選択後の献立登録

4. **既存関数変更**
   - `openScheduleRecipePicker(date, meal)`: ソート初期化を追加

## 確認したこと

- `app.html` 単独で完結。他ファイル未変更。
- `syncPendingChanges()` 経由の一括同期の原則は維持されている。
- `assignScheduleFromViewer` 内の `queueScheduleCreate` → `syncPendingChanges()` 流用。
