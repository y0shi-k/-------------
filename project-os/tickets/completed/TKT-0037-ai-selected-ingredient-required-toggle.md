---
id: TKT-0037-ai-selected-ingredient-required-toggle
title: AI指定食材の必須/任意切替
status: implementation_ready
goal: 指定食材からのAIレシピ考案で、食材ごとに必須/任意を選べるようにする
acceptance:
  - 選択済みバッジクリックで必須/任意が切り替わる
  - 新規選択は必須として始まる
  - 解除ボタンは選択解除だけを行う
  - プロンプトに必須食材と任意食材が分かれて反映される
required_evals:
  - ui_component_update
  - ai_prompt_regression
  - static_verify
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0037-ai-selected-ingredient-required-toggle.md
  - project-os/tickets/TKT-0037-ai-selected-ingredient-required-toggle.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0037-ai-selected-ingredient-required-toggle
related_artifacts:
  - artifacts/TKT-0037/verify.json
  - artifacts/TKT-0037/manual-smokes.md
  - artifacts/TKT-0037/review.md
  - artifacts/TKT-0037/report.md
owner_role: implementer
owner_notes:
  - Spreadsheet書き込みは変更しないため manual_bulk_sync_policy は対象外
---

# Summary

AIレシピ考案の「指定食材から」で、選択済み食材を必須/任意に分類してプロンプトへ反映する。

## 実装メモ

- 現在の選択状態は `Set` ではなく、IDごとに `required` を持つ構造にする。
- 任意食材のみでも生成を許可する。
