---
ticket_id: TKT-0039-remove-stale-ai-selection-functions
status: passed
execution_mode: static_only
target_evals:
  - static_cleanup
  - static_verify
---

# Manual Smokes

## executed_checks

- `clearAiSelection`, `updateAiSelectedTags`, `aiSelectedTagsList` の参照が残っていないことを確認。
- 既存verifyが `VERIFY_PASSED`。
- `git diff --check` が成功。

## skipped_checks

- UI挙動変更ではないためCanvas手動操作は未実施。

## open_risks

- なし。
