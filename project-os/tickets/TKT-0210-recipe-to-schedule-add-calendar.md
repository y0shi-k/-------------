---
id: TKT-0210-recipe-to-schedule-add-calendar
title: レシピ画面からのスケジュール登録（30日ミニカレンダー＋食事選択モーダル）
status: draft
goal: レシピ詳細ヘッダーと各レシピカードの両方から、Canvas版相当の「30日ミニカレンダー→朝/昼/晩選択→登録」フローでスケジュール（献立）に直接追加できるようにする。
acceptance:
  - レシピ詳細（選択中レシピ）のヘッダーに「スケジュール追加」入口ボタンが表示される
  - レシピ一覧の各レシピカードにもスケジュール追加の入口（小ボタン）が表示され、カードの既存操作（選択/調理/編集/削除/お気に入り）と競合しない
  - 入口を押すと、今日から30日分の日付を横スクロール表示するミニカレンダーモーダルが開く
  - 各日付セルにその日の献立件数が表示される（既存 `mealSchedules` から集計）
  - 日付を選択すると朝/昼/晩の食事タイプ選択が表示され、選択すると `addScheduleEntry(date, meal, recipeId)` で登録される
  - 登録後にモーダルが閉じ、成功フィードバックが出る（既存トースト/フィードバック方式に合わせる）
  - 既存スケジュール画面の「＋」からの登録、差し替え、移動、削除、調理完了の挙動を壊さない
  - 同一日付・食事タイプに複数献立を持てる既存仕様を壊さない
  - スマホ/PC双方でミニカレンダーが操作できる（横スクロール・タップ/クリック）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0210-recipe-to-schedule-add-calendar/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0210-recipe-to-schedule-add-calendar/verify.json
  - artifacts/TKT-0210-recipe-to-schedule-add-calendar/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0210`。コマンドの正本は `harness/registry.json`
  - 非危険変更。必須成果物は verify.json + report.md のみ
  - 参考UXは Canvas版 `app.html`（参照専用・編集禁止）の openScheduleAddModal / renderScheduleAddCalendar / assignScheduleFromViewer
---

# Summary

現状はスケジュール画面側からしか献立登録できない。Canvas版 `app.html` には「レシピ詳細→スケジュール追加→30日ミニカレンダー→朝/昼/晩選択→登録」という確立したUXがある（`app.html` の `openScheduleAddFromViewer` / `openScheduleAddModal` / `renderScheduleAddCalendar` / `selectScheduleAddDate` / `assignScheduleFromViewer` 参照）。これをWeb版へ移植し、レシピ詳細ヘッダーとレシピカードの**両方**に入口を設ける。登録は既存の `addScheduleEntry` を再利用する。

`required_evals` は active eval と変更範囲から決める。UI（モーダル/カレンダー/ボタン）とCSSの追加で、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行に該当しない（非危険）。

## 実装メモ

- 対象: `web/src/components/recipe-meal-workspace.tsx`、`web/src/app/globals.css`
- 参考（Canvas版 `app.html`・読むだけ）:
  - レシピ詳細の「スケジュール追加」ボタン → `openScheduleAddFromViewer()` → `openScheduleAddModal(recipeId)`
  - 30日カレンダー描画 `renderScheduleAddCalendar()`（今日から30日、各日に件数表示、今日を強調）
  - 日付選択 `selectScheduleAddDate(date)` → 食事タイプ選択ステップ表示
  - 食事選択＆登録 `assignScheduleFromViewer(meal)`（'夜'→'晩'正規化、同一枠の扱い）
- 再利用する既存資産（Web版）:
  - 登録: `addScheduleEntry(date, meal, recipeId)` `:1404-1448`（`meal_schedules` への INSERT＋楽観更新は既存実装に内包。**新規にテーブル直叩きしない**）
  - 既存献立データ: `mealSchedules` 状態（`:456`）を日付ごとに件数集計してカレンダーに表示
  - 食事タイプ/日付の型・フォーマット: `MealType` / `formatScheduleDayLabel` などスケジュール画面で使われている既存ユーティリティを流用
  - スケジュール画面側の日付ウィンドウ実装（`scheduleDays` / `scheduleWindowStart` `:475,566`）を日付生成の参考にする
- レシピ詳細ヘッダーの入口: 選択中レシピ（`selectedRecipeId`）の詳細表示領域に「スケジュール追加」ボタンを追加。既存の「買い物へ」ボタン（`:2949-2950` 付近）と同様のボタン配置パターンに合わせる
- レシピカードの入口: `RecipeList` のカード（`recipe-card` `:4367` 付近）に小ボタンを追加。カード本体の `onClick`（選択）と競合しないよう `event.stopPropagation()` を入れる
- 新規モーダル状態（例 `scheduleAddRecipeId` / `scheduleAddSelectedDate`）を追加。日付は `YYYY-MM-DD` 文字列で扱う（既存 `scheduled_on` 形式に合わせる）
- イミュータブル更新を徹底。秘密直書き禁止。GAS/Spreadsheet/Drive 不使用。Canvas `app.html` 非編集
- **danger eval 誤検出回避**: 登録は既存 `addScheduleEntry` を呼ぶだけにし、本diffに `.from("meal_schedules")` 等のテーブル名文字列や `auth`/`session` を新規に書かない

## 非ゴール

- 在庫不足チェック→買い物リスト追加の接続（TKT-0211で行う）
- ドラッグ&ドロップでの献立移動（既存スケジュール画面の機能。本チケットでは追加しない）
- Canvas版の「調理候補（候補リスト）」概念の移植
- スケジュール画面側UIの変更

## 依存チケット

- なし（TKT-0208/0209 とは独立。TKT-0211 が本チケットに依存する）

## 残リスク

- レシピカードへのボタン追加でカード操作（選択/D&D等）と競合するリスク → `stopPropagation` と手動スモークで確認
- 30日カレンダーの横スクロールがスマホ/PCで扱いづらくならないか → 実機幅で確認
