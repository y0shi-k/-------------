---
id: TKT-0209-schedule-picker-filter-sort-width
title: スケジュールのレシピ選択モーダルに検索/ソート/お気に入りを適用しPC向けに横幅拡張
status: completed
goal: スケジュール「＋」から開くレシピ選択モーダルを、レシピ一覧と同じ検索/ソート体験（レシピ名/食材/すべて・AND/OR・お気に入り・5種ソート）にし、PCで使える横幅へ広げる。
acceptance:
  - レシピ選択モーダルに TKT-0208 の共通フィルターUIが表示され、検索対象（レシピ名/食材/すべて）・AND/OR・お気に入り（すべて/お気に入り）・ソート（登録日時/更新日時/レシピ名/調理回数/材料数）が切り替えられる
  - モーダルのレシピ絞り込み/並び替え結果が `filterAndSortRecipes` を用い、レシピ一覧画面と同じロジックになる（現状の「レシピ名 includes」簡易フィルタを置き換える）
  - お気に入り絞り込みが効く（`is_favorite` で先行フィルタ → `filterAndSortRecipes`）
  - モーダルの検索/ソート/お気に入り状態は picker 専用で保持し、レシピ一覧画面側の状態とは独立している（一方の操作が他方に影響しない）
  - モーダルを開くたびに picker 専用状態が初期値へリセットされる（前回の検索語が残らない）
  - レシピ選択時の登録（新規追加=`addScheduleEntry`、差し替え=`replaceScheduleRecipe`）が従来通り動く
  - `.schedule-picker-modal` がPC幅で従来（min(480px,100%)）より広く、レシピ一覧が見やすい（リストの2カラム化等は実装判断。スマホ幅では破綻しない）
  - レシピが0件のときの空表示は維持する
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0209-schedule-picker-filter-sort-width/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0209-schedule-picker-filter-sort-width/verify.json
  - artifacts/TKT-0209-schedule-picker-filter-sort-width/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0209`。コマンドの正本は `harness/registry.json`
  - 非危険変更。必須成果物は verify.json + report.md のみ
  - 着手前提: TKT-0208 が完了し共通フィルターUIが存在すること
---

# Summary

レシピ選択モーダルは現在「レシピ名 includes」だけの簡易検索しか持たない（`recipe-meal-workspace.tsx:3037-3063`）。TKT-0208 で抽出した共通フィルターUIと既存 `filterAndSortRecipes` を組み込み、レシピ一覧と同じ検索/ソート/お気に入り体験にする。あわせて狭いモーダル幅（`globals.css:4065` の `min(480px,100%)`）をPC向けに広げる。

`required_evals` は active eval と変更範囲から決める。UIコンポーネントとCSS（レスポンシブ幅）の変更で、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行に該当しない（非危険）。

## 実装メモ

- 対象: `web/src/components/recipe-meal-workspace.tsx`、`web/src/app/globals.css`
- 現状のレシピ選択モーダル: `pickerSlot ? (...)` ブロック `:3015-3069`
  - 現在の簡易フィルタ: `recipes.filter((recipe) => recipe.name.toLowerCase().includes(pickerQuery...))` `:3046-3047`
  - 既存状態 `pickerQuery`（`:523`）は picker 専用検索語として再利用 or 置換する
- 再利用する既存資産:
  - 共通フィルターUI（TKT-0208 の `RecipeFilterControls`）
  - `filterAndSortRecipes(recipes, query, sort, searchMode, searchLogic)` `:399-422`
  - お気に入り先行フィルタの参照実装: レシピ一覧側 `recipeFavoriteOnly ? recipes.filter(r => r.is_favorite) : recipes`（`:561` 付近）
  - 登録処理: `addScheduleEntry(date, meal, recipeId)` `:1404-1448` / `replaceScheduleRecipe`（差し替え）。**これらは新規に書かず既存を呼ぶ**
- picker 専用状態を新設（例 `pickerSearch` / `pickerSearchLogic` / `pickerSearchMode` / `pickerSort` / `pickerFavoriteOnly`）。レシピ一覧用 `recipeSearch` 等（`:481-485`）とは**別状態**にする
- モーダルを開く `setPickerSlot(...)` のタイミング、または閉じる処理で picker 専用状態を初期化する（`setPickerSlot(null)` 周辺、`:3021-3024` の閉じる処理参照）
- CSS: `.schedule-picker-modal`（`globals.css:4065`）の幅をPCで拡張。`.schedule-picker-list` / `.schedule-picker-option` のレイアウト（必要なら grid 2カラム）も調整。スマホ幅（既存ブレークポイント）で破綻しないこと
- イミュータブル更新を徹底。秘密直書き禁止。GAS/Spreadsheet/Drive 不使用。Canvas `app.html` 非編集
- **danger eval 誤検出回避**: 登録は既存 `addScheduleEntry` を呼ぶだけにし、`.from("meal_schedules")` 等のテーブル名文字列を本diffへ新規に書かない

## 非ゴール

- レシピ一覧画面側のUI/挙動変更（TKT-0208で抽出済みUIを使うだけ）
- レシピ画面からのスケジュール登録導線（TKT-0210/0211）
- 新しい検索条件・ソート種別の追加
- スケジュール保存ロジックの変更

## 依存チケット

- TKT-0208（共通フィルターUIの抽出）に依存

## 残リスク

- picker 専用状態とレシピ一覧状態の取り違えによる相互干渉 → 別名状態で分離し、テストで独立性を確認
- 横幅拡張でスマホ表示が崩れるリスク → 既存ブレークポイントで確認
