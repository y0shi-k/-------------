---
id: TKT-0129-recipe-text-import-modal-parity
title: テキストから追加モーダルCanvas同等化
status: ready_for_spec_review
goal: Web版のレシピ本文構造化をCanvas版と同じ独立入口/独立モーダル導線へ戻す
acceptance:
  - レシピ集上部の `テキストから追加` から専用モーダルが開く
  - 本文貼り付け欄と `AIで構造化` の操作が分かりやすい
  - AI構造化後にレシピ編集モーダルへ渡り、保存前に内容確認できる
  - AI失敗時に原因、影響、修正方法を表示する
  - APIキーやAIプロンプト用の秘密情報をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - ai_server_route
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0129/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0129-recipe-text-import-modal-parity
related_artifacts:
  - artifacts/TKT-0129/verify.json
  - artifacts/TKT-0129/manual-smokes.md
  - artifacts/TKT-0129/review.md
  - artifacts/TKT-0129/report.md
owner_role: implementer
owner_notes:
  - TKT-0128完了後に実施する
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - 既存の本文構造化APIがある場合は再利用し、UI導線をCanvas版へ寄せる
---

# Summary

`テキストから追加` がAIパネル内に埋もれて見つけづらい問題を解消するチケット。
