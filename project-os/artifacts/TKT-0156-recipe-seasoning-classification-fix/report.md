---
ticket_id: TKT-0156-recipe-seasoning-classification-fix
status: ready
---

# TKT-0156 report

## 変更目的

「消費量を調整」画面で食材/調味料のタブ分けがあるのに、調味料として表示されるレシピが実質ゼロになる不具合を解消する。レシピの調味料区分（`item_type`）が履歴編集画面でも正しく分類表示され、AI生成レシピでも調味料が "調味料" 区分で登録されるようにする。

## 原因（調査結果）

データモデル（`recipe_ingredients.item_type`）は登録〜保存〜読込まで正常で、原因は消費量画面側のロジック2点だった。

1. **原因①（本命）**: 履歴編集の消費量調整（`cooking-record-edit-modal.tsx`）が、レシピの `item_type` ではなく「紐づく在庫アイテムの `category`」で分類していた（`stockItem?.category ?? "食材"`）。調味料は在庫登録されないことが多く `stockItem` が null → 既定の "食材" にフォールバック → 調味料タブが常に空。調理完了画面（`recipe-meal-workspace.tsx:2386`）は `ingredient.item_type` で正しく分類しており、2画面でロジックが食い違っていた。
2. **原因②**: AIレシピ生成のプロンプト（`recipe-generation.ts`）が調味料分類を指示しておらず、スキーマ例も食材のみ。AI生成・本文構造化のレシピがほぼ全て `item_type:"食材"` で返り、「調味料のレシピが1件もない」直接原因になり得た。

## 変更内容

- `web/src/lib/cooking-history/types.ts`
  - `ConsumptionEditDraft` に `item_type: RecipeIngredientType` を追加（`@/lib/recipes/types` から型 import）。
- `web/src/lib/cooking-history/edit.ts`
  - `buildEditDrafts(events, ingredients: RecipeIngredient[] = [])` がレシピ材料を受け取り、`名前|単位` のMapで `event.ingredient_name`＋`event.requested_unit` を照合して `item_type` を付与（未一致は "食材" にフォールバック）。
  - `buildDraftsFromRecipeIngredients` は各 draft に `ingredient.item_type` をそのまま付与。
- `web/src/components/cooking-record-edit-modal.tsx`
  - `loadConsumptionEvents`: `item.recipe_id` がある場合はイベント有無に関わらず先にレシピ材料を取得し、イベントあり経路は `buildEditDrafts(events, recipeIngredients)`、復元経路は `buildDraftsFromRecipeIngredients(recipeIngredients, inventoryItems)` に渡す。
  - 分類参照を在庫 category から `draft.item_type` に変更（`setVisibleConsumptionSelected` と表示行ビルダー）。
- `web/src/lib/ai/recipe-generation.ts`
  - `ingredientTypeRule()` を追加し generate / structure 両モードのプロンプトに挿入。`recipeJsonSchema()` の ingredients 例に調味料行を追加。パーサ（`normalizeIngredient`）は既に `調味料` を解釈するため変更なし。
- `web/src/__tests__/cooking-history-edit.test.ts`
  - 調味料イベントがレシピ材料照合で `item_type:"調味料"` になること、未一致時は "食材" フォールバックになること、復元経路で `item_type` が引き継がれることを追加検証。

## セキュリティと非対象

- APIキー、Supabase秘密鍵、写真URLなどの秘匿情報は追加していない。
- Supabase schema / migration / RLS / Storage / AI route のロジックは変更していない（`cooking_consumption_events` に列追加なし。分類はレシピ材料から引く方式）。
- `recipe-generation.ts` はプロンプト文言の追記のみで、Gemini連携ロジック・鍵の扱いは不変。
- Canvas版 `app.html` は未編集。

## 今回追加した安全装置

- 履歴編集の分類を在庫依存からレシピ材料の `item_type` に変更し、調理完了画面と分類ロジックを一致させた（2画面の食い違いを解消）。
- レシピ材料が引けない場合（recipe_id なし・材料未一致）は "食材" に安全フォールバックする。
- 追加テストで調味料分類・フォールバック・復元経路の引き継ぎを検証した。

## 実施した確認

`harness/bin/verify_web.sh TKT-0156-recipe-seasoning-classification-fix`

- lint: pass
- typecheck: pass
- test: pass
- build: pass
- no_gas_dependency: pass
- no_hardcoded_secret: pass
- supabase_rls_present: pass

追加確認:

- `cooking-history-edit.test.ts`: 10件 pass（調味料分類・"食材"フォールバック・復元経路の item_type 引き継ぎを含む）。

## 残リスク

- 既存レシピ（特にAI生成済み）は `item_type` が "食材" のまま残るため、過去データは再保存/再分類しない限り分類は変わらない（今回はデータ移行を含まない）。
- AIモデルが指示に従わず調味料を "食材" で返す可能性は残る（プロンプト指示は強制ではない）。
- 手動スモーク（調味料入りレシピを調理完了→履歴編集で調味料タブ表示、AI生成で調味料区分）はコード/テストでは確認済みだが、実機UIでの目視は未実施。
- `/check-gates` の diff 自動判定が `supabase_schema_change`（危険）へ過剰マッチした。実diffに schema/migration/RLS/Storage 変更が無いことを `manual-smokes.md` と `review.md` に記録した。

## 次の依頼や人判断

- 実機で、調味料入りレシピを調理完了→履歴編集を開き「調味料」タブに調味料が出ることを目視確認する。
- 既存のAI生成済みレシピの調味料を分類し直したい場合は、別途データ移行（item_type 再設定）の要否を判断する。
