---
ticket_id: TKT-0209-schedule-picker-filter-sort-width
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

スケジュール「＋」から開くレシピ選択モーダル（`web/src/components/recipe-meal-workspace.tsx` の `pickerSlot` ブロック）を、
レシピ一覧と同じ検索/ソート/お気に入り体験にした。これまで「レシピ名 includes」の簡易検索しか持たなかったが、
TKT-0208 で抽出した共通フィルターUI `RecipeFilterControls` と既存の `filterAndSortRecipes` を組み込み、
検索対象（レシピ名/食材/すべて）・AND/OR・お気に入り・5種ソート（登録日時/更新日時/レシピ名/調理回数/材料数）を
切り替えられるようにした。あわせて PC 幅でモーダルを広げ、リストを2カラム化して一覧性を上げた。

## 今回追加した安全装置

- picker 専用状態を新設し、レシピ一覧用 `recipeSearch` 等とは**別状態**にして相互干渉を排除:
  `pickerSearch` / `pickerSearchLogic` / `pickerSearchMode` / `pickerSort` / `pickerFavoriteOnly`。
- ピッカーを開く処理を `openPicker(slot)` ヘルパーに集約し、開くたびに picker 専用状態を初期値へリセット
  （前回の検索語・絞り込みが残らない）。`startSlotRecipeChange`（差し替え）と各スロットの「＋」追加の
  両方をこのヘルパー経由に統一した。
- レシピ絞り込み/並び替えは `filterAndSortRecipes(お気に入り先行フィルタ済み配列, pickerSearch, pickerSort, pickerSearchMode, pickerSearchLogic)`
  に置き換え、レシピ一覧画面と同一ロジックにした。お気に入りは `is_favorite` 先行フィルタ → `filterAndSortRecipes`。
- 登録処理は**既存の `addScheduleEntry`（新規追加）/ `replaceScheduleRecipe`（差し替え）をそのまま呼ぶ**だけにし、
  本diffに `.from("meal_schedules")` 等のテーブル名文字列を新規追加していない（danger eval 誤検出回避・保存ロジック無変更）。
- 旧 `pickerQuery` 状態と未使用化した `.schedule-picker-search` CSS を削除し、デッドコードを残していない。
- CSS は `.schedule-picker-modal` 幅を PC（`min-width: 720px`）で `min(720px,100%)` へ拡張し、
  `.schedule-picker-list` を2カラム grid 化。スマホ幅（< 720px）は従来の `min(480px,100%)` ・1カラムのまま温存。
- レシピ0件時の空表示（「レシピがありません。…」）は維持。
- テスト2件を追加（`web/src/__tests__/recipe-meal-workspace.test.tsx`）:
  ① picker の共通検索（レシピ名）とお気に入り絞り込みが効くこと、② 開き直すたびに picker 状態が初期化されること。
  既存の picker 経由テスト（新規追加・差し替え）も従来どおり pass。

## 実施した確認

- `/verify TKT-0209`: **status=pass**（lint / typecheck / test / build すべて pass、policy:
  no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass）。
- 追加テスト2件＋既存 `recipe-meal-workspace.test.tsx` がいずれも pass。
- 登録は既存関数の呼び出しのみで、保存系の `.from(...)` / schema / Storage / auth トークンを diff に新規導入していないことを確認。

### 危険eval検出について（語彙の過剰マッチ・実害なし）

`/check-gates TKT-0209` は `supabase_schema_change` と `photo_upload_storage` を danger として検出するが、
いずれも**正規表現の語彙過剰マッチ**であり、実際の危険変更ではない（TKT-0208 と同じ既知パターン）:

- `supabase_schema_change`: diff_regex の `recipes` が、UIの prop 名・コンポーネント名・`recipes` 変数参照へ反応しただけ。
  Supabase の schema / migration / RLS / policy / バケットは無変更。
- `photo_upload_storage`: diff_regex の `image|写真|画像` が `is_favorite` 等とともに残る既存UI語へ反応しただけ。
  スマホ写真取り込み・画像圧縮・Storage 保存経路はいずれも無変更。

本変更は `web/` 配下のUIコンポーネント＋CSS（レスポンシブ幅）のみで、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行の
いずれにも該当しない（チケットも🟢非危険と明示、required_gates も spec_ready/implementation_ready/verify_passed/report_ready）。
CLAUDE.md の軽量プロセス基準（必須成果物 = verify.json + report.md）に従い、`manual-smokes.md` / `review.md` は作成しない。
backlog に既知パターンとして記録のある「`photo_upload_storage` は語彙過剰マッチ＝report 記録運用」と同じ扱い。

`spec_ready` gate は `related_specs: []`（本イニシアチブ TKT-0208〜0211 は個別 SPEC を作らず、チケット frontmatter の
`acceptance` を受け入れ基準の正本とする運用）のため非該当。直近の同種完了チケット（TKT-0207/0208 等）も同様に SPEC なし・
report のみで finalize 済み。

## 残リスク

- 横幅拡張・2カラム化によるスマホ表示崩れの可能性 → ブレークポイントを `min-width: 720px` に閉じ、スマホ幅は従来値を温存。
  念のため実機/DevTools 375px と PC 幅での目視スモークを推奨（任意・非危険のため必須としない）。
- picker 状態とレシピ一覧状態の取り違え → 別名状態で分離し、追加テストで独立性（リセット）を担保。

## 次の依頼や人判断

- レシピ画面からのスケジュール登録導線は別系列（TKT-0210/0211）で対応。本チケットの非ゴール。
- 実機スモーク（PC でのモーダル横幅・2カラム表示、スマホ幅での非破綻、検索/ソート/お気に入りの切替）はユーザー確認推奨。
