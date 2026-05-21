---
ticket_id: TKT-0075-modal-backdrop-close-policy
status: passed
execution_mode: static_only
target_evals:
  - ui_component_addition
---

# Manual Smokes

## target_evals

- モーダル外クリック制御の静的確認

## executed_checks

- `recipeModal` は `handleModalBackdropClick(event, closeRecipeModal)` を呼び、共通判定では close 許可リストに含めていないことを確認した。
- `itemModal`, `recipeTextModal`, `aiRequestModal`, `scheduleRecipeModal`, `shoppingShortageSelectModal`, `scheduleAddModal`, `consumptionModal`, `cookingRecordModal` は close 許可リストに含めていないことを確認した。
- `aiAddMenuModal`, `scheduleSlotMenu`, `scheduleSlotDeleteModal`, `scheduleBatchDeleteModal`, `substitutionModal` は close 許可リストに含めていることを確認した。
- `aiRecipePreviewModal` は `state._aiPreviewMode === 'viewing'` の時だけ背景クリックで閉じる判定になっていることを確認した。

## skipped_checks

- Gemini Canvas 上の実機タップ確認はユーザー実施。

## open_risks

- ブラウザ実表示でのタップ領域・重なり確認は未実施。
