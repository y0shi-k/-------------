---
ticket_id: TKT-0224-shopping-shortage-name-match
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

在庫に「卵」があるのにレシピ「たまご」が不足扱いになり、買わなくていい物が買い物候補に出る誤判定をなくす。TKT-0222 の `matchesIngredientName` を買い物不足計算に適用した。

- `web/src/components/recipe-meal-workspace.tsx` `inventoryAmountByNameAndUnit()`: フィルタ条件の `item.name === name` を `matchesIngredientName(item.name, name)` に置換（**unit 一致条件は維持**）。正規化一致・辞書一致する在庫の量を合算する。
- この1点の変更で、`compareRecipeWithInventory` 経由の3箇所すべて——①スケジュール追加起点の不足モーダル（`openShortageModalForScheduledRecipe`）②調理ビュー起点の不足モーダル ③調理ビュー材料カードの在庫不足バッジ（`data-shortage`）——に同じ判定が効く。

## 今回追加した安全装置

- **部分一致は合算しない**: `matchesIngredientName` は部分一致で false を返すため、在庫「豚こま切れ肉」×レシピ「豚肉」は従来どおり不足として出る（誤マッチで本当に不足している物が買い物リストから漏れる=買い忘れを防ぐ。SPEC-0222 のユーザー確定方針）。テストで固定。
- 単位不一致は従来どおり合算しない（テストで固定）。
- `compareRecipeWithInventory` のシグネチャ・`confirmRecipeShortageSelection`（shopping_items への INSERT 経路）は無変更。
- テスト4件追加: 同義語で不足モーダルが開かない／一部不足時の差分計算（卵1個×たまご3個→不足2個）／部分一致のみは不足として出る／単位不一致は合算しない。

## 実施した確認

- `/verify TKT-0224`: lint / typecheck / test（38ファイル・377件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。

## 残リスク

- 辞書未収録の同義語は引き続き完全一致扱い（辞書拡充は name-match.ts 側の運用）。

## 次の依頼や人判断

- なし。supabase_schema_change 等の eval マッチは `meal_schedules`/`recipes` トークンの過剰マッチで、実 schema・INSERT 経路は無変更（manual-smokes.md / review.md に記録。チケット owner_notes で予見済み）。
