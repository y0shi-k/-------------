---
ticket: TKT-0067-app-html-line-reduction-refactor
status: ready_with_canvas_smoke_pending
date: 2026-05-19
---

# Report

## Summary

`app.html` の行数削減リファクタを実施。対象は既存ヘルパ適用漏れ、空状態HTML、レシピプレビュー、レシピ編集モーダルの入力行テンプレートに限定した。

## Changes

- `emptyStateHtml()` を追加し、対象の空表示HTMLを集約。
- フロント側のレシピ配列パースを `parseJsonArray()` / `getRecipeItems()` / `getCookingRecipeParts()` に寄せた。
- `openAiRecipePreview()` / `openRecipeViewer()` の材料・調味料・手順リスト描画を `renderAiPreviewParts()` に集約。
- レシピ編集モーダルの材料/調味料/下ごしらえ/調理工程行を共通テンプレート関数に集約。
- 参照ゼロだった `addStepRow` / `renumberSteps` / `getIngredientCategoryBadge` を削除。

## Verification

- `VERIFY_PASSED`
- `JS_PARSE_PASSED`
- `git diff --check` PASS
- `app.html`: 7963行 → 7798行（165行削減）

## Pending

- Canvas実機プレビューで代表画面と操作の手動確認。
