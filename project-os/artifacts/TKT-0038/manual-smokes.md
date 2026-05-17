---
ticket_id: TKT-0038-ai-recipe-regenerate-handler
status: passed
execution_mode: static_only
target_evals:
  - ai_recipe_regression
  - static_verify
---

# Manual Smokes

## executed_checks

- `regenerateAiRecipe()` が未定義の `generateAiRecipe()` を呼ばないことを確認。
- `regenerateAiRecipe()` が直前の生成コンテキストを `_aiPending*` に戻して `generateAiRecipeFromPlan()` を呼ぶことを確認。
- 既存verifyが `VERIFY_PASSED`。

## skipped_checks

- Canvas上の再生成クリックと実Gemini通信は未実施。

## open_risks

- 実API通信の成否はCanvas環境のAPIキーとGemini応答に依存する。
