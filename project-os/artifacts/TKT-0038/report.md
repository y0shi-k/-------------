---
ticket_id: TKT-0038-ai-recipe-regenerate-handler
status: ready
---

# Report

## 変更目的

生成レシピプレビューの「再生成」で `generateAiRecipe is not defined` が発生する問題を修正した。

## 実装内容

- `regenerateAiRecipe()` の呼び先を未定義の `generateAiRecipe()` から既存の `generateAiRecipeFromPlan()` に変更。
- 再生成前に直前の生成モード・食材を `_aiPending*` に戻し、必要ならプロンプトを再構築するようにした。

## 実施した確認

- 既存verify: `VERIFY_PASSED`
- `generateAiRecipe(` の残存呼び出しなし。
- `git diff --check`: passed

## 残リスク

- Canvas上の実Gemini再生成通信は未実施。
