---
ticket_id: TKT-0210-recipe-to-schedule-add-calendar
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

これまでスケジュール画面の「＋」からしか献立登録できなかったが、Canvas版 `app.html` の確立したUX
（レシピ詳細→スケジュール追加→30日ミニカレンダー→朝/昼/晩選択→登録）を Web版へ移植した。
レシピ詳細ヘッダーと各レシピカードの**両方**にスケジュール追加の入口を設け、今日から30日分を横スクロール表示する
ミニカレンダーモーダルから日付→食事タイプを選んで登録できるようにした
（`web/src/components/recipe-meal-workspace.tsx`、`web/src/app/globals.css`）。

**入口の置き場所に関する修正（レビュー指摘反映）**: 当初「レシピ詳細パネル」（`recipe-detail-panel`）に入口を
置いたが、このパネルは `canvas-hidden-compat`（sr-only・視覚的に非表示）でユーザーには見えなかった。
Web版でユーザーが実際に見る「レシピ詳細ヘッダー」は**調理ビューア全画面のヘッダー**（`cooking-overlay-header`、
料理名＋「編集」ボタンの行）であるため、入口ボタンはそこ（`cooking-overlay-schedule`）へ移した。
非表示パネル側に重複ボタンは残していない。

## 今回追加した安全装置

- 登録は**既存の `addScheduleEntry(date, meal, recipeId)` をそのまま呼ぶ**だけにし、本diffに
  `.from("meal_schedules")` 等のテーブル名文字列・`auth`/`session` を新規追加していない
  （danger eval 誤検出回避・保存ロジック無変更）。`assignScheduleFromRecipe(meal)` は引数を組み立てて
  既存関数へ委譲するだけの薄いラッパ。
- モーダル専用状態を新設し、既存のスケジュール画面状態（`scheduleWindowStart` / `scheduleDate` /
  `pickerSlot` 等）とは**別状態**にして相互干渉を排除: `scheduleAddRecipeId` / `scheduleAddSelectedDate`。
- 登録成功時のモーダルクローズは `addScheduleEntry` 成功分岐に集約（既存 `setPickerSlot(null)` の隣に
  `setScheduleAddRecipeId(null)` / `setScheduleAddSelectedDate(null)` を追加）。エラー時は早期 return で
  閉じず、既存の `feedback`（error トーン）がそのまま表示される。成功フィードバックも既存方式
  （「献立に追加しました。」）を再利用し、新たなトースト機構を増やしていない。
- レシピカードの小ボタンは既存アイコンボタン群（料理する/編集/削除/お気に入り）と同じ
  `event.stopPropagation()` 方式で、カード本体の `onClick`（選択）と競合しないようにした。
- スケジュール追加モーダルの backdrop は `schedule-add-backdrop`（z-index 95）にし、調理ビュー全画面
  （`cooking-overlay` = 85）や消費量/不足モーダル（= 90）の上、削除確認（= 100）の下に出るよう階層を明示した
  （調理ビューのヘッダーから開いてもモーダルが背面に隠れない）。
- 日付は `YYYY-MM-DD` 文字列で扱い（既存 `scheduled_on` 形式に一致）、日付生成は既存 `todayValue()` /
  `addDays()`、件数集計は既存 `mealSchedules` 状態を `reduce` で日付別カウント。新規ユーティリティを乱造していない。
- 食事タイプは Canvas版に合わせ 朝/昼/晩（`scheduleAddMealTypes`）。既存 `MealType` 型・`mealTypes` を流用。
- イミュータブル更新を徹底（状態の直接変更なし）。GAS/Spreadsheet/Drive 不使用。Canvas `app.html` 非編集。
- テスト2件を追加（`web/src/__tests__/recipe-meal-workspace.test.tsx`）:
  ① レシピ詳細ヘッダーの入口→ミニカレンダー先頭セル選択→朝で `meal_schedules` insert が
  正しい payload（recipe-1/カレー/`meal_type:朝`/`status:未完了`/`scheduled_on` が `YYYY-MM-DD`）で呼ばれ、
  成功フィードバックが出ること、② レシピカードの小ボタンからも同モーダルが開き晩で登録できること。
  日付選択前は朝/昼/晩ボタンが出ないこともアサート。

## 実施した確認

- `/verify TKT-0210`: **status=pass**（lint / typecheck / test / build すべて pass、policy:
  no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass）。
- 追加テスト2件＋既存 `recipe-meal-workspace.test.tsx`（計47件）がいずれも pass。
- 既存スケジュール画面の登録／差し替え／移動／削除／調理完了テストが従来どおり pass（挙動非破壊）。
- 登録は既存関数の呼び出しのみで、保存系の `.from(...)` / schema / Storage / auth トークンを diff に
  新規導入していないことを確認。

### 危険eval検出について（語彙の過剰マッチ・実害なし）

`/check-gates TKT-0210` は `supabase_schema_change` と `photo_upload_storage` を danger として検出するが、
いずれも**正規表現の語彙過剰マッチ**であり、実際の危険変更ではない（TKT-0208/0209 と同じ既知パターン）:

- `supabase_schema_change`: diff_regex の `recipes` 等が、UIの prop 名・コンポーネント名・`recipes` 変数参照へ
  反応しただけ。Supabase の schema / migration / RLS / policy / バケットは無変更。
- `photo_upload_storage`: diff_regex の `image|写真|画像` が `recipeImageUrls` 等の既存UI語へ反応しただけ。
  スマホ写真取り込み・画像圧縮・Storage 保存経路はいずれも無変更。

本変更は `web/` 配下のUIコンポーネント（モーダル/カレンダー/ボタン）＋CSS のみで、DBスキーマ・auth/RLS・
Storage・AIルート・CSV移行のいずれにも該当しない（チケットも🟢非危険と明示、required_gates も
spec_ready/implementation_ready/verify_passed/report_ready）。CLAUDE.md の軽量プロセス基準
（必須成果物 = verify.json + report.md）に従い、`manual-smokes.md` / `review.md` は作成しない。

`spec_ready` gate は `related_specs: []`（本イニシアチブ TKT-0208〜0211 は個別 SPEC を作らず、チケット
frontmatter の `acceptance` を受け入れ基準の正本とする運用）のため非該当。直近の同種完了チケット
（TKT-0207/0208/0209）も同様に SPEC なし・report のみで finalize 済み。

## 残リスク

- レシピカードへのボタン追加でカード操作（選択/D&D等）と競合するリスク → 既存アイコンボタンと同じ
  `stopPropagation` 方式に揃えた。念のため実機タップでの誤選択がないか目視スモークを推奨（任意・非危険）。
- 30日カレンダーの横スクロールがスマホ/PCで扱いづらくならないか → 横スクロール（`overflow-x:auto` ＋
  `-webkit-overflow-scrolling:touch`）で実装。実機幅（375px）と PC 幅での操作感の目視確認を推奨。
- 登録後はスケジュール画面の7日ウィンドウが必要に応じ移動するが（既存 `addScheduleEntry` の挙動）、
  `activeView` は切り替えないためレシピ画面の表示は維持される。

## 次の依頼や人判断

- 在庫不足チェック→買い物リスト追加の接続は **TKT-0211**（本チケットに依存）で対応。本チケットの非ゴール。
- 実機スモーク（レシピ詳細ヘッダー／各カードからの起動、30日カレンダーの横スクロール・件数表示・今日強調、
  朝/昼/晩での登録と成功フィードバック、スマホ375px/PCでの操作感、既存スケジュール機能の非破壊）はユーザー確認推奨。
