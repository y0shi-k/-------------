---
id: SPEC-0038
title: AIレシピ再生成ハンドラ修正
status: spec_ready
scope:
  - `app.html` のAI生成レシピプレビュー再生成ボタン
constraints:
  - AIレシピ生成プロンプトの仕様は変更しない
  - Spreadsheet書き込み、GAS通信、データスキーマは変更しない
acceptance:
  - 生成レシピプレビューの「再生成」で未定義関数エラーが出ない
  - 再生成時は直前のAI考案コンテキストを使って既存生成フローを再実行する
  - 既存verifyが通る
related_tickets:
  - TKT-0038-ai-recipe-regenerate-handler
---

# Summary

AI生成レシピプレビューの「再生成」が、存在しない旧関数 `generateAiRecipe()` を呼び、ReferenceErrorになっていた。既存の `generateAiRecipeFromPlan()` へ接続し直す。
