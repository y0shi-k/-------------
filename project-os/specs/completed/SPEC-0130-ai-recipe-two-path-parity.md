---
id: SPEC-0130-ai-recipe-two-path-parity
title: AI考案2択導線Canvas同等化
status: spec_ready
scope:
  - web/
  - AI recipe generation
  - recipe preview
constraints:
  - Gemini APIキーをブラウザへ出さない
  - AI結果を直接保存せず、プレビュー確認を挟む
  - Canvas版 `app.html` は変更しない
acceptance:
  - レシピ集の `AI考案` から選択メニューまたはモーダルが開く
  - `優先消費レシピ` と `指定食材から` の2つを選べる
  - 指定食材では必須/任意の考え方を扱える
  - AI生成後にプレビューし、保存前に編集確認できる
  - AI処理中はキャンセルまたは中断状態が分かる
  - Web版verifyが通る
related_tickets:
  - TKT-0130-ai-recipe-two-path-parity
---

# Summary

Canvas版のAI考案入口を、`優先消費レシピ` と `指定食材から` の2択導線としてWeb版へ戻す。
