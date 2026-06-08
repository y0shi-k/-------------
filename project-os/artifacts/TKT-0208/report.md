---
ticket_id: TKT-0208-shared-recipe-filter-controls
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

スケジュールのレシピ選択モーダル（TKT-0209）にレシピ一覧と同じ検索/ソート/お気に入りUIを載せるための
**土台リファクタ**。これまで `web/src/components/recipe-meal-workspace.tsx` の `RecipeList` 内にインラインで
書かれていた「検索対象タブ（レシピ名/食材/すべて）・AND/OR・検索入力（クリアボタン含む）・ソート行
（登録日時/更新日時/レシピ名/調理回数/材料数）・お気に入りチップ（すべて/お気に入り）」を、状態を持たない
プレゼンテーショナルコンポーネント `web/src/components/recipe-filter-controls.tsx`（`RecipeFilterControls`）へ
切り出した。**見た目・挙動は一切変えない純粋な抽出**で、レシピ一覧側のリグレッションがないことを最優先にした。

## 今回追加した安全装置

- 抽出コンポーネントは**プレゼンテーショナル**（状態を持たず、値とコールバックを props で受ける）。
  `filterAndSortRecipes` には依存せず、状態（`recipeSearch` / `recipeSearchLogic` / `recipeSearchMode` /
  `recipeSort` / `recipeFavoriteOnly`）は `RecipeMealWorkspace` 側のままで変更していない。
- `searchTabs` / `sortTabs` のラベル定義と型（`RecipeSearchLogic` / `RecipeSearchMode` / `RecipeSort`）は
  抽出先 `recipe-filter-controls.tsx` に**1か所だけ**置き、`recipe-meal-workspace.tsx` 側は import に切り替えて
  重複定義を残していない（型はワークスペースの状態・`filterAndSortRecipes` 署名でもこの import を流用）。
- 件数行（`recipe-count-row`）はモーダルで不要になり得るため**抽出対象に含めず**、`RecipeList`（呼び出し側）に
  残した。レシピ一覧の現行表示は維持。
- CSS クラス（`recipe-search-controls` / `recipe-search-mode-tabs` / `recipe-search-logic` /
  `recipe-search-field` / `recipe-sort-row` / `recipe-filter-chips` / `canvas-hidden-compat`）はクラス名も
  マークアップ構造も変えずそのまま移設し、`globals.css` の既存定義をそのまま使う（見た目を保つため）。
- 抽出コンポーネントの描画/操作テスト `web/src/__tests__/recipe-filter-controls.test.tsx`（4件）を追加。
  各タブの data-active 表示と、5種のコールバック（検索対象/AND-OR/検索入力＋クリア/ソート/お気に入り）の発火を担保。

## 実施した確認

- `/verify TKT-0208`: **status=pass**（lint / typecheck / test / build すべて pass、policy:
  no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass）。
- 新規テスト `recipe-filter-controls.test.tsx`（4件）と既存 `recipe-meal-workspace.test.tsx` がいずれも pass。
- 抽出は既存行の機械的移動に限定。`git diff` の追加行に storage / migration / schema / auth / getUser / session 等の
  危険トークンを新規導入していないことを確認（純粋なUI抽出）。

### 危険eval検出について（語彙の過剰マッチ・実害なし）

`/check-gates TKT-0208` は `supabase_schema_change` と `photo_upload_storage` を danger として検出するが、
いずれも**正規表現の語彙過剰マッチ**であり、実際の危険変更ではない:

- `supabase_schema_change`: diff_regex `...|recipes|...` が、UIの prop 名・コンポーネント名に含まれる
  `recipes`（例 `recipes={recipes}`）へ反応しただけ。Supabase の schema / migration / RLS / policy / バケットは無変更。
- `photo_upload_storage`: diff_regex `photo|image|写真|画像` が、`imageUrls` などのUI語へ反応しただけ。
  スマホ写真取り込み・画像圧縮・Storage 保存経路はいずれも無変更。

本変更は `web/` 配下のUIコンポーネント抽出のみで、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行の
いずれにも該当しない（チケットも🟢非危険と明示）。CLAUDE.md の軽量プロセス基準（必須成果物=verify.json + report.md）
に従い、`manual-smokes.md` / `review.md` は作成しない。これは backlog に既知パターンとして記録のある
「`photo_upload_storage` は語彙過剰マッチ＝report記録運用」と同じ扱い。

`spec_ready` gate は `related_specs: []`（このイニシアチブ TKT-0208〜0211 は `/breakdown` が個別 SPEC を作らず
チケット frontmatter の `acceptance` を受け入れ基準の正本とする運用）のため非該当。受け入れ基準はチケット側に
定義済みで、直近の同種完了チケット（TKT-0207 等）も同様に SPEC なし・report のみで finalize 済み。

## 残リスク

- props 受け渡しの取りこぼしによるレシピ一覧の微妙な挙動変化の可能性 → 既存テスト＋新規テストで担保。
  念のためレシピ一覧画面で各タブ/AND-OR/検索＋クリア/各ソート/お気に入りが従来通り動くことの目視スモークを推奨
  （任意・非危険のため必須としない）。

## 次の依頼や人判断

- TKT-0209（レシピ選択モーダルへ `RecipeFilterControls` + `filterAndSortRecipes` を適用、PC向け横幅拡張）に着手可能。
  本チケットの抽出成果がその前提。
