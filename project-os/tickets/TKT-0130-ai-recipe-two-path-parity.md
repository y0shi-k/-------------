---
id: TKT-0130-ai-recipe-two-path-parity
title: AI考案2択導線Canvas同等化
status: ready_for_spec_review
goal: Web版のAI考案をCanvas版と同じ優先消費/指定食材の2択入口へ戻す
acceptance:
  - レシピ集上部の `AI考案` から2択導線へ進める
  - `優先消費レシピ` は期限が近い食材を使う流れになる
  - `指定食材から` は食材選択と必須/任意指定を扱える
  - AI生成結果はプレビューまたは編集モーダルで確認してから保存する
  - AI処理中、失敗、キャンセルの状態が見える
  - Web版verifyが通る
required_evals:
  - ai_server_route
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0130/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0130-ai-recipe-two-path-parity
related_artifacts:
  - artifacts/TKT-0130/verify.json
  - artifacts/TKT-0130/manual-smokes.md
  - artifacts/TKT-0130/review.md
  - artifacts/TKT-0130/report.md
owner_role: implementer
owner_notes:
  - TKT-0129完了後に実施する
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - 既存AIレシピ生成APIがある場合は再利用し、入口と確認導線を優先して直す
---

# Summary

AI考案機能をCanvas版と同じ探しやすい2択導線に戻すチケット。
