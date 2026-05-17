---
id: TKT-0038-ai-recipe-regenerate-handler
title: AIレシピ再生成ハンドラ修正
status: implementation_ready
goal: 生成レシピの再生成ボタンで未定義関数エラーが出ないようにする
acceptance:
  - `regenerateAiRecipe()` が存在しない `generateAiRecipe()` を呼ばない
  - 再生成が既存の `generateAiRecipeFromPlan()` に接続される
  - 既存verifyが通る
required_evals:
  - ai_recipe_regression
  - static_verify
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0038-ai-recipe-regenerate-handler.md
  - project-os/tickets/TKT-0038-ai-recipe-regenerate-handler.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0038-ai-recipe-regenerate-handler
related_artifacts:
  - artifacts/TKT-0038/verify.json
  - artifacts/TKT-0038/manual-smokes.md
  - artifacts/TKT-0038/review.md
  - artifacts/TKT-0038/report.md
owner_role: implementer
owner_notes:
  - Spreadsheet書き込みは変更しない
---

# Summary

AI生成レシピプレビューの再生成ボタンが旧関数名を参照していたため、既存生成フローへ接続し直す。
