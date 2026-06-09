---
ticket_id: TKT-0213-calendar-meal-schedule-display
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

献立スケジュール（`meal_schedules`）の予定が料理・記録カレンダーに反映されない問題を解消する。予定のある日を一目で把握でき、選択日の詳細に未完了の献立を予定行として表示する。TKT-0214（カードUI刷新）の前提となる土台。表示のみの改修で、献立の作成/編集/削除/完了には触れない。

## 今回追加した安全装置

- **新規DB問い合わせを足さない**: 既に `page.tsx` で server fetch 済みの `mealSchedules` を `CookingHistoryBoard` に `initialMealSchedules` として渡す配線のみ（Supabase への追加クエリ・RLS/Storage 変更なし）。
- **意味の一致**: カレンダーセルの「予定」ドット（`data-kind="schedule"`）は `items.length === 0 && 当日に予定あり` のときだけ点灯させ、凡例の「予定のみ」と表示意味を一致させた。
- **記録と予定の分離**: `HistoryDateGroup` に `schedules?: MealSchedule[]`（既定 `[]`）を追加し、選択日の **未完了** 予定だけを記録行とは別系統の予定行として描画。件数表示は `items + schedules` 合算、空メッセージは「記録も予定も無い日」のみに限定し、記録0件＋予定ありで空表示が出ないようにした。

## 実施した確認

- `/verify TKT-0213` → **VERIFY_PASSED**（lint / typecheck / test / build すべて pass、policy 4項目 pass）。artifact: `project-os/artifacts/TKT-0213/verify.json`。
- ユニットテスト（`web/src/__tests__/cooking-history-board.test.tsx`）:
  - `renderBoard` に `initialMealSchedules` を追加（型修正）。
  - カレンダーで選択日の未完了予定が予定行として表示され、完了済み予定は出ず、予定行の「レシピを見る」が `requestViewRecipe(recipe_id, "cooking")` を呼ぶことを検証。

## 残リスク

- `meal_schedules` 語が diff に出るため `supabase_schema_change` に機械マッチするが、実スキーマ/migration/auth/RLS/Storage には一切触れない表示のみの変更（TKT-0210 と同様）。よって `manual_smokes_done` / `review_ready` gate の未閉表示は語彙過剰マッチで、軽量プロセス（verify.json + report.md）で完了する。
- spec は無い単票変更のため `spec_ready` gate は N/A（`related_specs: []`）。
- `recipe-meal-workspace` との双方向 live 同期はしておらず、初期 server fetch 値で表示する（カレンダー画面からの献立作成/編集/削除/完了は非対応）。

## 次の依頼や人判断

- 実機/DevTools 375px での目視（`pwa_mobile_ui`）: 「予定のみ日」「記録のみ日」「両方ある日」「どちらも無い日」の4パターンで、ドット点灯と詳細の予定行・空表示が破綻しないこと。
