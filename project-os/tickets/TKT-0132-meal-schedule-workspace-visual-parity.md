---
id: TKT-0132-meal-schedule-workspace-visual-parity
title: スケジュール画面Canvas表示寄せ
status: ready_for_spec_review
goal: Web版の献立スケジュールをCanvas版の7日表示と朝昼晩スロット導線へ近づける
acceptance:
  - 7日分の献立がCanvas版に近い密度で確認できる
  - 朝/昼/晩の各スロットに追加入口がある
  - 今日表示、日送り、削除、移動が分かりやすい
  - スマホで操作しやすく、ドラッグ操作だけに依存しない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0132/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0132-meal-schedule-workspace-visual-parity
related_artifacts:
  - artifacts/TKT-0132/verify.json
  - artifacts/TKT-0132/manual-smokes.md
  - artifacts/TKT-0132/review.md
  - artifacts/TKT-0132/report.md
owner_role: implementer
owner_notes:
  - TKT-0131完了後に実施する
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - データ保存形式を変える場合はCSV移行への影響を記録する
---

# Summary

献立スケジュールを画面単位でCanvas版へ寄せるチケット。
