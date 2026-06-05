---
id: TKT-0109-recipes-and-meal-schedule-web
title: レシピ・献立・調理導線のWeb版移植
status: ready_for_implementation
goal: レシピ、献立、買い物、調理完了の主要ワークフローをWeb版で使えるようにする
acceptance:
  - レシピ一覧/詳細/作成/編集がある
  - 献立スケジュールにレシピを配置できる
  - 献立から買い物リストを作れる
  - 調理完了時に料理履歴へ記録できる
  - スマホ/タブレットで主要操作が破綻しない
  - Web版verifyが通る
required_evals:
  - auth_and_rls_policy
  - pwa_mobile_ui
  - web_project_bootstrap
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0109/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0109-recipes-and-meal-schedule-web
related_artifacts:
  - artifacts/TKT-0109/verify.json
  - artifacts/TKT-0109/manual-smokes.md
  - artifacts/TKT-0109/review.md
  - artifacts/TKT-0109/report.md
owner_role: implementer
owner_notes:
  - TKT-0108完了後に実施する
  - 大きい場合はサブチケット分割してよいが、このticketに紐付ける
  - 完了後は TKT-0113-canvas-parity-audit に進む。TKT-0110 CSV移行へ直行しない
---

# Summary

レシピ/献立の主要移植チケット。Web版v1の機能面を完成に近づける。

## 実装メモ

- Canvas版の便利な流れを残しつつ、Web版ではDB保存を標準にする。
- UIはスマホで繰り返し使いやすい密度にする。
- 一度に大きくなりすぎる場合は、画面単位で小さく分ける。

## 次

TKT-0113-canvas-parity-audit
