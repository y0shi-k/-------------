---
id: SPEC-0156-recipe-seasoning-classification-fix
title: 消費量調整画面の調味料分類不具合の修正仕様（履歴編集の分類をレシピ由来に統一＋AI生成プロンプトの調味料指示）
status: spec_ready
scope:
  - web/src/lib/cooking-history/types.ts
  - web/src/lib/cooking-history/edit.ts
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/lib/ai/recipe-generation.ts
  - web/src/__tests__/cooking-history-edit.test.ts
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 非危険変更（UIロジック＋AI生成プロンプト文言）。Supabase schema / migration / Auth・RLS / 写真Storage / CSV移行は触らない
  - `cooking_consumption_events` テーブルには列を追加しない（分類はレシピ材料から照合して引く）
  - `recipe-generation.ts` はプロンプト文言の追記のみ。generateContent / GEMINI_API_KEY / responseMimeType 等のロジックや鍵の扱いは変更しない
  - `unit_conversion` など他のDB保存形・既存の消費明細/レシピ保存内容は変更しない
constraints_notes:
  - 調理完了画面（`recipe-meal-workspace.tsx`）の分類ロジック（`ingredient.item_type` 基準）は正しいため変更せず、履歴編集画面側をそれに合わせる
acceptance:
  - 履歴編集の消費量調整画面が、紐づく在庫の category ではなくレシピ材料の item_type で食材/調味料を分類する
  - 在庫未登録の調味料でも消費量調整画面の「調味料」タブに表示される
  - 消費イベントから復元する経路でも、レシピ材料名＋単位で照合して item_type を引く（未一致時は "食材" にフォールバック）
  - 調理完了画面と履歴編集画面で分類ロジックが一致する
  - AI生成・本文構造化のプロンプトが「醤油・味噌・塩・砂糖等は item_type を 調味料」と明示し、スキーマ例にも調味料行を含む
  - DBスキーマ・RLS・Storage は変更せず、既存の消費明細・レシピ保存内容が壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0156-recipe-seasoning-classification-fix
---

# Summary

「消費量を調整」画面で食材/調味料のタブ分けがあるのに、調味料として表示されるレシピが実質ゼロになる不具合を修正する。原因は消費量画面側のロジック2点で、データモデル（`recipe_ingredients.item_type`）自体は正常。

## 背景

- DBスキーマ（`recipe_ingredients.item_type text not null default '食材' check (item_type in ('食材','調味料'))`）、手動レシピ登録（食材欄・調味料欄が別）、保存・読込のいずれも `item_type` を正しく扱っている。
- **原因①（本命）**: 履歴編集の消費量調整（`cooking-record-edit-modal.tsx`）が、レシピの `item_type` ではなく「紐づく在庫アイテムの `category`」で分類していた（`stockItem?.category ?? "食材"`）。調味料は在庫登録されないことが多く `stockItem` が null → 既定の "食材" にフォールバック → 調味料タブが常に空。
- **原因②**: AIレシピ生成のプロンプト（`recipe-generation.ts`）が調味料分類を指示しておらず、スキーマ例も食材のみ。AI生成・本文構造化のレシピがほぼ全て `item_type:"食材"` で返り、「調味料のレシピが1件もない」直接原因になり得た。
- 調理完了画面（`recipe-meal-workspace.tsx:2386`）は `ingredient.item_type` で正しく分類しており、2画面でロジックが食い違っていた。

## 仕様

### A. 履歴編集の分類をレシピ由来に統一（スキーマ変更なし）

- `ConsumptionEditDraft` に `item_type: RecipeIngredientType` を追加。
- `buildEditDrafts(events, ingredients = [])`: レシピ材料を `名前|単位` のMapにし、`event.ingredient_name`＋`event.requested_unit` で照合して `item_type` を付与（未一致は "食材"）。
- `buildDraftsFromRecipeIngredients`: `ingredient.item_type` をそのまま付与。
- `cooking-record-edit-modal.tsx`: `item.recipe_id` がある場合はイベント有無に関わらず先にレシピ材料を取得し、両経路に渡す。分類参照を在庫 category から `draft.item_type` に変更。

### B. AI生成プロンプトに調味料分類を指示

- `recipe-generation.ts`: `ingredientTypeRule()` を generate / structure 両モードに挿入し、`recipeJsonSchema()` の例に調味料行を追加。パーサは既に `調味料` を解釈するため変更なし。

## 残リスク

- 既存レシピ（特にAI生成済み）は `item_type` が "食材" のまま残る（今回はデータ移行を含まない）。
- AIモデルが指示に従わず調味料を "食材" で返す可能性は残る。
- `/check-gates` の diff 自動判定が、文脈行に含まれるテーブル名様の語（`recipe_ingredients` / `cooking_history` / 写真処理コード等）により `supabase_schema_change` へ過剰マッチする。実diffに schema/migration/RLS/Storage の変更が無いことを manual-smokes.md / review.md に記録する。
