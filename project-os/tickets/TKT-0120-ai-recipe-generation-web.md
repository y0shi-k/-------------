---
id: TKT-0120-ai-recipe-generation-web
title: AIレシピ考案と本文構造化Web移植
status: completed
goal: Canvas版のAIレシピ考案と本文構造化をWeb版へ安全に移す
acceptance:
  - AIレシピ考案がサーバー側API経由で動く
  - 期限切れ優先、指定食材、必須/任意指定を扱える
  - レシピ本文を構造化してプレビューできる
  - プレビューからレシピ保存できる
  - Web版verifyが通る
required_evals:
  - ai_server_route
  - auth_and_rls_policy
  - supabase_schema_change
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0120/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0120-ai-recipe-generation-web
related_artifacts:
  - artifacts/TKT-0120/verify.json
  - artifacts/TKT-0120/manual-smokes.md
  - artifacts/TKT-0120/review.md
  - artifacts/TKT-0120/report.md
owner_role: implementer
owner_notes:
  - TKT-0119完了後に実施する
  - APIキーをブラウザへ出さない
  - AI出力は必ずユーザー確認後に保存する
---

# Summary

AIレシピ機能のCanvas版差分を埋めるチケット。
