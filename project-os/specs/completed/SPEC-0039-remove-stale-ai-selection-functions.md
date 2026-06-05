---
id: SPEC-0039
title: 未使用AI選択関数の削除
status: spec_ready
scope:
  - `app.html` の旧AI食材選択補助関数
constraints:
  - 現行のAI食材選択UI挙動は変更しない
  - Spreadsheet書き込み、GAS通信、データスキーマは変更しない
acceptance:
  - 未使用の `clearAiSelection()` と `updateAiSelectedTags()` が削除されている
  - `aiSelectedTagsList` 参照が残っていない
  - 既存verifyが通る
related_tickets:
  - TKT-0039-remove-stale-ai-selection-functions
---

# Summary

必須/任意トグル導入後の現行UIでは使われない旧AI食材選択関数を削除し、将来誤って呼ばれた場合のDOM参照エラーを防ぐ。
