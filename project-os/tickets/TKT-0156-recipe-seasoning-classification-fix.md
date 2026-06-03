---
id: TKT-0156-recipe-seasoning-classification-fix
title: 消費量調整画面で調味料が分類されない不具合の修正（履歴編集の分類ロジック統一＋AI生成プロンプトの調味料指示）
status: ready
goal: 消費量調整画面の調味料タブが常に空になる状態を解消し、レシピの調味料区分（item_type）が履歴編集画面でも正しく分類表示され、AI生成レシピでも調味料が "調味料" 区分で登録されるようにする
acceptance:
  - 履歴編集の消費量調整画面が、紐づく在庫の category ではなくレシピ材料の item_type で食材/調味料を分類する
  - 在庫未登録の調味料でも消費量調整画面の「調味料」タブに表示される
  - 消費イベントから復元する経路でも、レシピ材料名＋単位で照合して item_type を引く（未一致時は "食材" にフォールバック）
  - 調理完了画面（recipe-meal-workspace.tsx）と履歴編集画面（cooking-record-edit-modal.tsx）で分類ロジックが一致する
  - AI生成・本文構造化のプロンプトが「醤油・味噌・塩・砂糖等は item_type を 調味料」と明示し、スキーマ例にも調味料行を含む
  - DBスキーマ・RLS・Storage は変更しない（既存の消費明細・レシピ保存内容が壊れない）
  - Web版verifyが通る
required_evals:
  - eval_selection_mode で /check-gates により diff から自動判定
eval_selection_mode: auto
changed_paths:
  - web/src/lib/cooking-history/types.ts
  - web/src/lib/cooking-history/edit.ts
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/lib/ai/recipe-generation.ts
  - web/src/__tests__/cooking-history-edit.test.ts
  - project-os/artifacts/TKT-0156-recipe-seasoning-classification-fix/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0156-recipe-seasoning-classification-fix
related_artifacts:
  - artifacts/TKT-0156-recipe-seasoning-classification-fix/verify.json
  - artifacts/TKT-0156-recipe-seasoning-classification-fix/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（UIロジック＋AI生成プロンプト文言）。Supabase schema / Auth・RLS / 写真Storage / CSV移行は触らない。`cooking_consumption_events` テーブルには列を追加せず、分類はレシピ材料から引く方式（スキーマ変更なし）。
  - `recipe-generation.ts` はプロンプト文言の追記のみで、generateContent / GEMINI_API_KEY / responseMimeType 等のロジックや鍵の扱いは変更していない。`/check-gates` が `ai_server_route` に過剰マッチした場合は実diffを確認し、必要なら manual-smokes.md / review.md を追加する。
  - verify は `/verify TKT-0156-recipe-seasoning-classification-fix`（= `harness/bin/verify_web.sh`）。
  - Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。
---

# Summary

「消費量を調整」画面で食材/調味料のタブ分けがあるのに、調味料として表示されるレシピが実質ゼロになる不具合を修正する。データモデル（`recipe_ingredients.item_type`）は登録〜保存〜読込まで正常で、原因は消費量画面側のロジック2点。

1. **原因①（本命）**: 履歴編集の消費量調整（`cooking-record-edit-modal.tsx`）が、レシピの `item_type` ではなく「紐づく在庫アイテムの `category`」で分類していた（`stockItem?.category ?? "食材"`）。調味料は在庫登録されないことが多く `stockItem` が null → 既定の "食材" にフォールバック → 調味料タブが常に空。調理完了画面（`recipe-meal-workspace.tsx:2386`）は `ingredient.item_type` で正しく分類しており、2画面でロジックが食い違っていた。
2. **原因②**: AIレシピ生成のプロンプト（`recipe-generation.ts`）が調味料分類を指示しておらず、スキーマ例も食材のみ。AI生成・本文構造化のレシピがほぼ全て `item_type:"食材"` で返り、「調味料のレシピが1件もない」直接原因になり得た。

方針（ユーザー確定）: ①②両方を修正。①はDBスキーマ変更せず、消費明細をレシピ材料から照合して `item_type` を引く方式（完了画面とロジック統一）。

## 実装メモ

### 修正①: 履歴編集の分類をレシピ由来に統一（スキーマ変更なし）

- `web/src/lib/cooking-history/types.ts`
  - `ConsumptionEditDraft` に `item_type: RecipeIngredientType` を追加（`@/lib/recipes/types` から型 import）。
- `web/src/lib/cooking-history/edit.ts`
  - `buildEditDrafts(events, ingredients: RecipeIngredient[] = [])` がレシピ材料を受け取り、`名前|単位` のMapで `event.ingredient_name`＋`event.requested_unit` を照合して `item_type` を付与（未一致は "食材"）。
  - `buildDraftsFromRecipeIngredients` は `ingredient.item_type` をそのまま付与。
- `web/src/components/cooking-record-edit-modal.tsx`
  - `loadConsumptionEvents`: `item.recipe_id` がある場合はイベント有無に関わらず先にレシピ材料を取得し、イベントあり経路は `buildEditDrafts(events, recipeIngredients)`、復元経路は `buildDraftsFromRecipeIngredients(recipeIngredients, inventoryItems)` に渡す。
  - 分類参照を在庫 category から `draft.item_type` に変更（`setVisibleConsumptionSelected` と表示行ビルダー）。

### 修正②: AI生成プロンプトに調味料分類を指示

- `web/src/lib/ai/recipe-generation.ts`
  - `ingredientTypeRule()` を追加し、generate / structure 両モードのプロンプトに挿入。
  - `recipeJsonSchema()` の ingredients 例に調味料行（`{"item_type":"調味料","name":"醤油","amount":15,"unit":"ml"}`）を追加。
  - パーサ（`normalizeIngredient`）は既に `調味料` を解釈するため変更なし。

### テスト

- `web/src/__tests__/cooking-history-edit.test.ts`
  - 調味料イベントがレシピ材料照合で `item_type:"調味料"` になること、未一致時は "食材" フォールバックになること、復元経路で `item_type` が引き継がれることを追加検証。

### 共通方針

- Web版でGAS/Spreadsheet/Driveを使わない。APIキー・秘密情報を直書きしない。
- 既存のコード規約・命名・import エイリアス（`@/`）・immutable patterns に合わせる。console.log を残さない。

## 残リスク

- 既存レシピ（特にAI生成済み）は `item_type` が "食材" のまま残るため、過去データは再保存/再分類しない限り分類は変わらない（今回はデータ移行を含まない）。
- AIモデルが指示に従わず調味料を "食材" で返す可能性は残る（プロンプト指示は強制ではない）。
- 手動スモーク（調味料入りレシピを調理完了→履歴編集で調味料タブ表示、AI生成で調味料区分）は未実施。
- `/check-gates` の diff 自動判定が `ai_server_route` 等の危険evalへ過剰マッチした場合、manual-smokes.md / review.md の追加が必要。
