---
id: SPEC-0035-ai-recipe-add-entrypoint
title: AI考案導線のレシピ追加統合
status: implementation_ready
scope:
  - Mode B のレシピ集タブ上部アクション
  - AI考案の入口UI
constraints:
  - GAS通信、Spreadsheet schema、pendingSync 構造は変更しない
  - AI生成・プレビュー・保存の既存フローを維持する
  - レシピ操作ごとの即時GAS通信は追加しない
acceptance:
  - Mode B 上部タブは レシピ集 / スケジュール の2タブになる
  - レシピ集上部に 新規レシピ / テキストから追加 / AI考案 が並ぶ
  - AI考案から 優先消費レシピ と 指定食材から の既存フローに入れる
  - 期限食材一覧はトップレベルタブではなくAI考案メニュー内の補助導線として表示される
  - AI生成レシピ保存は `queueRecipeCreate()` と手動一括同期のまま動く
  - 標準 verify が成功する
related_tickets:
  - TKT-0035-ai-recipe-add-entrypoint
---

# Summary

AI考案を独立タブではなく、レシピ集の「追加」導線へ統合する。AIはレシピを作って保存する用途なので、新規作成・テキスト追加と同じ入口に並べ、スケジュールとのタブ構造をシンプルにする。
