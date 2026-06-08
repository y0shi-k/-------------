---
id: TKT-0208-shared-recipe-filter-controls
title: レシピ検索/ソート/お気に入りUIを再利用可能コンポーネントへ抽出（土台）
status: completed
goal: レシピ一覧とスケジュールのレシピ選択モーダルで同一の検索/ソートUIを使えるよう、検索対象タブ・AND/OR・検索入力・ソート行・お気に入りチップを再利用可能なプレゼンテーショナルコンポーネントへ切り出す。レシピ一覧の見た目と挙動は不変に保つ。
acceptance:
  - 検索対象タブ（レシピ名/食材/すべて）・AND/OR・検索入力（クリアボタン含む）・ソート行（登録日時/更新日時/レシピ名/調理回数/材料数）・お気に入りチップ（すべて/お気に入り）を1つの再利用可能コンポーネント（例 `RecipeFilterControls`）として切り出す
  - 抽出後もレシピ一覧画面の表示・操作・絞り込み/並び替え結果が抽出前と完全に同一である（リグレッションなし）
  - コンポーネントはプレゼンテーショナル（状態を持たず、値とコールバックを props で受ける）で、`filterAndSortRecipes` には依存しない
  - `searchTabs` / `sortTabs` のラベル定義が抽出先に移り、レシピ一覧側に重複定義が残らない
  - 既存の `recipeSearch` / `recipeSearchLogic` / `recipeSearchMode` / `recipeSort` / `recipeFavoriteOnly` の状態管理は `RecipeMealWorkspace` 側のまま変更しない
  - 既存テストが通り、必要なら抽出コンポーネントの描画テストを追加する
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/recipe-filter-controls.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0208-shared-recipe-filter-controls/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0208-shared-recipe-filter-controls/verify.json
  - artifacts/TKT-0208-shared-recipe-filter-controls/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0208`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
  - 非危険変更。必須成果物は verify.json + report.md のみ
  - required_evals は `/check-gates` で diff から自動判定される（eval_selection_mode: auto）
---

# Summary

スケジュールのレシピ選択モーダル（TKT-0209）にレシピ一覧と同じ検索/ソートUIを載せるための**土台リファクタ**。今は検索/ソートのUIマークアップが `RecipeList`（`recipe-meal-workspace.tsx`）内にインラインで書かれており、そのままでは別モーダルで再利用できない。共通プレゼンテーショナルコンポーネントへ切り出す。本チケットは**見た目・挙動を一切変えない**ことが最優先（純粋な抽出）。

`required_evals` は `harness/change_evals.json` の active eval と変更範囲から決める。本変更は `web/` 配下のUIコンポーネント抽出のみで、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行のいずれにも該当しない（非危険）。

## 実装メモ

- 対象ファイル: `web/src/components/recipe-meal-workspace.tsx`（約4,600行・単一ファイルに集約）
- 抽出元の該当ブロック（現状の行番号目安）:
  - フィルター/ソートUI: `RecipeList` 内 `recipe-search-controls` 〜 `recipe-filter-chips`（おおよそ `:4317-4356`）
  - `searchTabs` / `sortTabs` 定義: `:4302-4313`
  - `RecipeList` の検索系 props 定義: `:4290-4301`
- 型は既存を流用（新規作成しない）: `RecipeSearchLogic` / `RecipeSearchMode` / `RecipeSort`（`:95-97`）。型を別ファイル参照にする場合も定義の重複を作らない
- 状態は `RecipeMealWorkspace` 側に残す: `recipeSearch` / `recipeSearchLogic` / `recipeSearchMode` / `recipeSort` / `recipeFavoriteOnly`（`:481-485`）
- 抽出コンポーネントの props 案: `searchMode` / `searchLogic` / `search` / `sort` / `favoriteOnly` と対応する `onXxxChange` コールバック。`totalCount` 等の表示はモーダルで不要になり得るので、件数行（`recipe-count-row` `:4357-4360`）は**抽出対象に含めず**呼び出し側に残すか、表示有無を props で切替できるようにする（レシピ一覧の現行表示は維持）
- CSS クラス（`recipe-search-controls` 等）は既存の `globals.css` 定義をそのまま使う。クラス名は変えない（レシピ一覧の見た目を保つため）
- イミュータブルに（状態は setter 経由で更新、オブジェクト直接変更をしない）
- 確認方法: 抽出後にレシピ一覧で各タブ/AND-OR/検索/各ソート/お気に入りが従来通り動くことを目視 + 既存テストで担保
- 禁止事項: GAS/Spreadsheet/Drive を使わない。APIキー等の秘密を直書きしない。Canvas版 `app.html` は編集しない
- **danger eval 誤検出回避**: 本チケットでは `meal_schedules` / `recipes` 等のテーブル名文字列や `auth`/`session`/`getUser` を**新規に**diffへ持ち込まない（純粋なUI抽出に留める）。既存行の機械的移動に限定する

## 非ゴール

- 検索/ソートのロジック自体の変更（`filterAndSortRecipes` `:399-422` は触らない）
- スケジュールのレシピ選択モーダルへの組み込み（TKT-0209で行う）
- 新しい検索条件・ソート種別の追加
- 状態管理を Context 化すること（props 受け渡しで十分）

## 依存チケット

- なし（この4チケット群の最初。TKT-0209 がこの成果に依存する）

## 残リスク

- 抽出時に props 受け渡しの取りこぼしでレシピ一覧の挙動が微妙に変わる可能性 → 既存テスト + 目視スモークで確認する
