---
ticket: TKT-0067-app-html-line-reduction-refactor
status: static_checked_canvas_not_run
date: 2026-05-19
---

# Manual Smoke Notes

Canvas実機プレビューはこの環境では未実施。以下はコード上の確認範囲。

## Checked

- 食材一覧・買い物リスト・登録待ち: 空状態HTMLを `emptyStateHtml()` に置換し、既存文言と表示クラス相当を維持。
- レシピ一覧/検索・献立レシピ選択: `getRecipeItems()` / `parseJsonArray()` を使う形に置換し、材料名検索・材料数・前回調理日の読み取り経路を維持。
- レシピ詳細/AIプレビュー: 材料・調味料・下ごしらえ・調理工程リストを `renderAiPreviewParts()` 経由に集約。
- レシピ編集モーダル: 材料/調味料行を `renderRecipeItemInputRow()`、手順行を `renderRecipeStepInputRow()` に集約。既存の input class 名は維持。
- 調理完了/消費調整: `getCookingRecipeParts()` と `parseJsonArray()` を使う形に置換し、`pendingSync` 更新経路は変更なし。

## Canvas Follow-up

- Gemini Canvasに `app.html` を貼り付け、食材一覧、買い物リスト、レシピ一覧/検索、レシピ詳細、レシピ編集、献立レシピ選択、調理完了/消費調整を確認する。
