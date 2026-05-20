---
ticket: TKT-0072-schedule-controls-spacing
status: ready
---

# Report

## Summary

スケジュール画面の操作欄から不要な固定高さと「7日分」行を削除し、一覧が選択モード行の直下へ詰まるようにした。

## Changes

- `renderRecipeModeControls()` のスケジュール分岐で `recipeSecondaryRow` の固定高さを解除。
- スケジュール分岐で `recipeSelectRow` を非表示化し、「7日分」表示を削除。
- 「同期は上部の同期ボタンで一括反映」を選択モード行の右端へ移動し、横幅不足時は省略表示にした。
- レシピ集タブへ戻る場合は、既存の `h-20` / `h-8` レイアウトへ戻す。

## Verification

- 標準 verify: PASS
- `alert(` / `confirm(` / `prompt(`: なし
- `executeGAS(payload...)`: 既存呼び出しのみ
- `app.html` 内の `7日分` / `日分`: なし
