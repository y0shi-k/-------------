---
id: TKT-0213-calendar-meal-schedule-display
title: 料理・記録カレンダーに献立スケジュールを表示（ドット＋日付詳細に予定行）
status: completed
goal: 献立スケジュールに予定が入っている日が料理・記録カレンダーに反映されない問題を解消し、予定のある日を一目で把握できて選択日の詳細に未完了の献立を表示する。
acceptance:
  - 料理・記録→カレンダー表示で、献立スケジュールに予定がある日のセルに「予定」ドット（`data-kind="schedule"`）が表示される
  - 「予定」ドットは記録が無い日（その日の `cooking_history` が0件）にのみ点灯し、凡例の「予定のみ」と意味が一致する
  - カレンダー凡例の「予定のみ」に対応する緑系ドットが表示され、既存の記録/写真/高評価ドットと色で区別できる
  - 日付セルを選択すると、その日の詳細リストに当日の「未完了」の献立が予定行として表示される（レシピ名・食事区分（朝/昼/晩/その他）・未完了が分かる）
  - 予定行は既存の料理記録行とは視覚的に区別され、記録行の編集/表示操作に干渉しない
  - 予定行に `recipe_id` がある場合はレシピへの導線を出してよい（無い場合は出さない）
  - 既存のカレンダー（記録ドット・写真サムネ・選択挙動・タイムライン/振り返りビュー）の挙動を壊さない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/page.tsx
  - web/src/components/cooking-history-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0213-calendar-meal-schedule-display/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0213-calendar-meal-schedule-display/verify.json
  - artifacts/TKT-0213-calendar-meal-schedule-display/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0213`。コマンドの正本は `harness/registry.json`
  - 非危険変更（表示のみ。既存取得済み `meal_schedules` を読むだけで、スキーマ/auth/RLS/Storage/AI/CSVに該当しない）。必須成果物は verify.json + report.md のみ
  - `meal_schedules` という語が diff に出るため `supabase_schema_change` 正規表現に機械マッチし得るが、スキーマ変更・migration・policy 変更は一切行わない（TKT-0210 と同様の判断）
---

# Summary

料理・記録（COOKING RECORD）カレンダーは `cooking_history`（実績）しか表示しておらず、献立スケジュール（`meal_schedules`）の予定が反映されない。凡例には「予定のみ」というラベルだけが先行実装され、ドット・予定行は未実装。`meal_schedules` は `web/src/app/page.tsx` で server fetch 済みだが `CookingHistoryBoard` に渡されていないのが原因。

本チケットは「予定が入っていてもカレンダーに出ない」を解消する。データは既存の server fetch 初期値で表示する（献立側の即時同期は本チケットの非ゴール）。

`required_evals` は UI/CSS とデータ配線の追加で DBスキーマ・auth/RLS・Storage・AIルート・CSV移行に該当しない（非危険）。レスポンシブ表示の確認対象として `pwa_mobile_ui` を採用。

## 実装メモ

- 対象ファイル:
  - `web/src/app/page.tsx`: 既に取得している `mealSchedules`（`from("meal_schedules").select("*")...` の結果、page.tsx の cooking ブロック付近 151–157行で `CookingHistoryBoard` を描画）を `initialMealSchedules` として `CookingHistoryBoard` に渡す。
  - `web/src/components/cooking-history-board.tsx`:
    - props 型 `CookingHistoryBoardProps`（12–16行）に `initialMealSchedules: MealSchedule[]` を追加。`import type { MealSchedule } from "@/lib/recipes/types"`（`MealSchedule` は `id` / `scheduled_on`(YYYY-MM-DD) / `meal_type`("朝"|"昼"|"晩"|"その他") / `recipe_id` / `recipe_name` / `status`("未完了"|"完了") を持つ）。
    - 月セル描画（287–317行の `calendarCells.map`）で、当日の予定を `initialMealSchedules.filter((s) => s.scheduled_on === key)` で抽出。`.calendar-dots`（306–310行）に、`items.length === 0 && scheduleForDay.length > 0` のときだけ `<i data-kind="schedule" />` を追加（「予定のみ」日に点灯）。
    - 凡例（319–324行）の「予定のみ」テキストに `<i data-kind="schedule" />` を付けて他ドットと体裁を揃える。
    - 選択日の詳細 `HistoryDateGroup`（412–471行で定義、325–332行で呼び出し）に、当日の**未完了**予定（`status === "未完了"` かつ `scheduled_on === selectedDate`）を新規 prop（例: `schedules: MealSchedule[]`）で渡し、記録行（436–463行の `.history-item`）とは別の予定行として描画する。予定行はレシピ名・食事区分バッジ・「未完了」を表示。`recipe_id` があれば `onViewRecipe(recipe_id, "cooking")` への導線を出してよい。
    - 件数表示（`{items.length}件`, 431行）と空表示（467行「この日の料理記録・予定はありません。」）は、予定の有無も加味して破綻しないよう調整する（記録0件でも予定があれば空メッセージを出さない）。
  - `web/src/app/globals.css`: `.calendar-dots i[data-kind="schedule"]`（凡例「予定のみ」に合わせ緑系。既存 record/photo/rating ドットの定義に倣う）と、予定行（記録行と区別できる控えめなスタイル＋食事区分バッジ）を追加。
- 既存パターン/再利用:
  - 記録のドット・写真サムネ判定（290–294行, 306–310行）の書き方をそのまま踏襲して schedule 判定を足す。
  - 食事区分の表示・正規化や日付フォーマットは、献立側（`web/src/components/recipe-meal-workspace.tsx` の `MealType` 周辺ユーティリティ）の既存表記に合わせる。
- 注意:
  - GAS/Spreadsheet/Drive を使わない。APIキー直書き禁止。
  - 新規に Supabase へ問い合わせない（page.tsx で取得済みの値をそのまま流用）。スキーマ・RLS・Storage には触れない。

## 非ゴール

- 献立スケジュールの作成/編集/削除/調理完了の操作をこの画面から行えるようにすること（表示のみ）。
- カレンダー側で献立変更を即時反映する双方向同期（別 state の `recipe-meal-workspace` との live 同期）。
- 「完了」済み献立や過去予定の集計・統計表示。

## 依存チケット

- なし（土台。後続 TKT-0214 が同じ `cooking-history-board.tsx` / `HistoryDateGroup` を続けて改修するため、本チケットを先に完了させる）

## 残リスク

- `HistoryDateGroup` が記録行と予定行の2系統を扱うことで分岐が増える。記録0件＋予定ありの空表示条件を取りこぼすと既存の空メッセージが誤表示される可能性があるため、verify 時に「予定のみ日」「記録のみ日」「両方ある日」「どちらも無い日」を手元確認する。
