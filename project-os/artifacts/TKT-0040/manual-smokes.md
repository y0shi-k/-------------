---
ticket_id: TKT-0040-activity-statusbar-blur-exclude
status: passed
execution_mode: static_only
target_evals:
  - ui_component_update
  - static_verify
---

# Manual Smokes

## executed_checks

- `z-[55]` → `z-[90]` への変更が diff で確認された（app.html:67）。
- `alert(` / `confirm(` / `prompt(` の残存がないことを確認。
- `showToast` 関数が存在することを確認。
- 既存verifyが `VERIFY_PASSED`。
- `git diff --check` が成功。

## skipped_checks

- 変更は単一の z-index 値変更のみで、UI挙動の Canvas 実機手動操作は未実施（差分が極小かつ静的確認で十分）。

## open_risks

- なし。
