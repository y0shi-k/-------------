---
ticket_id: TKT-0156-recipe-seasoning-classification-fix
status: passed
review_scope:
  - SPEC-0156-recipe-seasoning-classification-fix
  - TKT-0156-recipe-seasoning-classification-fix
---

# TKT-0156 review

## checked_diff_paths

- `web/src/lib/cooking-history/types.ts`
- `web/src/lib/cooking-history/edit.ts`
- `web/src/components/cooking-record-edit-modal.tsx`
- `web/src/lib/ai/recipe-generation.ts`
- `web/src/__tests__/cooking-history-edit.test.ts`

## checked_artifacts

- `verify.json`: pass
- `manual-smokes.md`: passed
- `report.md`: ready

## findings

重大な未解決問題は見つからない。確認したこと:

- `ConsumptionEditDraft` に `item_type` を追加し、履歴編集の分類を在庫 `category` 依存からレシピ材料の `item_type` 由来へ変更。調理完了画面（`recipe-meal-workspace.tsx` の `ingredient.item_type` 基準）と分類ロジックが一致した。
- `buildEditDrafts` はレシピ材料を `名前|単位` の Map にし、消費イベントの `ingredient_name`＋`requested_unit` で照合。未一致・材料未提供時は "食材" に安全フォールバックする。
- `cooking-record-edit-modal.tsx` は `recipe_id` がある場合にイベント有無に関わらずレシピ材料を取得し、両経路（イベントあり/復元）に渡している。エラー時は従来どおりフィードバック表示＋空ドラフト。
- 在庫未登録の調味料でも `draft.item_type` で分類されるため「調味料」タブに表示される（在庫 `stockItem` への依存を分類から除去）。
- `recipe-generation.ts` は `ingredientTypeRule()` を generate/structure 両モードに挿入し、スキーマ例に調味料行を追加したのみ。`generateContent` / `GEMINI_API_KEY` / `response_mime_type` 等のロジック・鍵の扱いは不変。パーサ `normalizeIngredient` は既存の `調味料` 解釈を流用。
- テストは調味料分類・"食材"フォールバック・復元経路の item_type 引き継ぎを追加。10件 pass。
- Canvas版 `app.html` は未編集。APIキー・秘密情報の追加なし。verify policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass。
- `/check-gates` の `supabase_schema_change` は過剰マッチ。`supabase/` は未編集で、`git diff -- web/` に schema/migration/RLS/Storage 関連の追加が無いことを実読で確認した。

## open_risks

- 既存レシピ（特にAI生成済み）は `item_type` が "食材" のまま残る（データ移行は含まない）。
- AIモデルが指示に従わず調味料を "食材" で返す可能性は残る（プロンプト指示は強制ではない）。
- 実機UIでの「調味料タブ表示」目視は未実施。コード/テストでは退行なし。

## verdict

review_ready: pass（`verify_passed` / `manual_smokes_done` / `review_ready` を満たす。over-match の危険eval `supabase_schema_change` は実変更を伴わないことを diff 実読で確認済み）
