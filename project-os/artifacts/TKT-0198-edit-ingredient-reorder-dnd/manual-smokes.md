---
ticket_id: TKT-0198-edit-ingredient-reorder-dnd
status: passed
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - web_project_bootstrap
---

# Manual Smokes

> 注: `supabase_schema_change` / `web_project_bootstrap` は差分の語彙（`recipes` 等）による過剰マッチで発火している。
> 本変更は schema/migration/Storage/RLS/新規DB書き込み経路をいずれも変更していない（後述）。

## target_evals

- 編集モーダルの材料行をD&Dで並び替えできること
- 編集モーダルの調味料行をD&Dで並び替えできること
- 並び替えが材料セクション内・調味料セクション内に限定され、セクションをまたがないこと
- 並び替え後に保存すると、その表示順が `recipe_ingredients.sort_order` に反映されること
- 既存の行追加・削除・数量・単位編集が壊れていないこと
- スマホ幅でハンドル付き材料行が崩れないこと
- DB schema/Storage/auth/RLS を変更していないこと

## executed_checks

- `recipe-meal-workspace.test.tsx` を拡張（計37件）。追加2件で、(1) 編集モーダルの材料行をD&D並び替え→`レシピを更新` で `recipe_ingredients` insert ペイロードの `sort_order` が並び替え後の表示順どおりになること、(2) 食材を調味料行へドロップしてもセクションをまたがず保存順が変わらないこと、を検証して成功。
- `npm run lint` / `npm run typecheck` / `npm run test` / `npm run build` を含むWeb版verify（`harness/bin/verify_web.sh TKT-0198-edit-ingredient-reorder-dnd`）が pass。
- 差分確認で、保存処理本体（`saveRecipe` / `normalizeRecipeForm`）は未変更であり、新設 `moveIngredient` は `recipeValues.ingredients` の immutable 入替に限定されることを確認した。
- Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認した。
- Canvas版 `app.html` を編集していないことを確認した。

## skipped_checks

- 実機スマホでの3本線ハンドルによるD&D操作感（タッチでの掴みやすさ）の目視は未実施。HTML5 D&D はスマホで操作しづらい場合があるため、操作目印としてハンドルを追加した範囲にとどまる。
- 実ブラウザでの「並び替え→保存→再表示で順序維持」の最終目視は未実施。保存経路は既存 `saveRecipe`（`sort_order` 採番）を未変更で流用しており、自動テストで insert ペイロードの順序を確認して代替した。

## open_risks

- 実機スマホでのD&D操作感はユーザー環境で最終確認してほしい。
- `moveIngredient` は並び替え時に配列を「食材→調味料」の順へ集約する（全画面ビュー `moveCookingIngredient` と同方針）。セクションは別々に描画されるため表示は不変だが、保存後の `sort_order` は食材が先・調味料が後にまとまる。
- `supabase_schema_change` / `web_project_bootstrap` は語彙マッチによる発火で、実schema/migration/Storage/RLS/新規DB書き込みは変更していない。
