---
id: SPEC-0120-ai-recipe-generation-web
title: AIレシピ考案と本文構造化Web移植
status: spec_ready
scope:
  - web/
  - AI API routes
  - recipes
constraints:
  - Gemini APIキーをブラウザへ出さない
  - AI結果を直接確定せず、確認画面を挟む
acceptance:
  - 期限切れ優先や指定食材からAIレシピを考案できる
  - 食材の必須/任意を扱える
  - レシピ本文をAIで構造化できる
  - プレビュー確認後にレシピ保存できる
related_tickets:
  - TKT-0120-ai-recipe-generation-web
---

# Summary

Canvas版のAIレシピ機能を、Next.jsサーバー側API経由でWeb版へ移す。
