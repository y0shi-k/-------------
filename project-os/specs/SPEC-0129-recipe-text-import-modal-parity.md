---
id: SPEC-0129-recipe-text-import-modal-parity
title: テキストから追加モーダルCanvas同等化
status: spec_ready
scope:
  - web/
  - recipe text import
  - recipe editor modal
constraints:
  - Gemini APIキーをブラウザへ出さない
  - AI構造化結果を直接保存せず、ユーザー確認を挟む
  - Canvas版 `app.html` は変更しない
acceptance:
  - レシピ集の `テキストから追加` ボタンから独立モーダルが開く
  - モーダルにレシピ本文を貼り付けられる
  - `AIで構造化` 後、レシピ編集モーダルで内容を確認できる
  - 確認後に保存でき、キャンセル時は保存されない
  - エラー時に原因、影響、修正方法が分かる
  - Web版verifyが通る
related_tickets:
  - TKT-0129-recipe-text-import-modal-parity
---

# Summary

Canvas版と同じ `ボタン → テキスト貼り付けモーダル → AI構造化 → レシピ編集モーダルで確認` の流れへ戻す。
