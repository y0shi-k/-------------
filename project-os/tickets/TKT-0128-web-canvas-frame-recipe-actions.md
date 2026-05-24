---
id: TKT-0128-web-canvas-frame-recipe-actions
title: Web版共通フレームとレシピ集3導線復元
status: ready_for_implementation
goal: Web版の確認土台をCanvas版に寄せ、レシピ集上部に新規レシピ/テキストから追加/AI考案の入口を戻す
acceptance:
  - 主要画面がCanvas版に近い中央カラム幅で表示される
  - 下部3ナビで食材管理、献立・レシピ、料理・記録を切り替えられる
  - 上部ステータスで待機中、保存中、AI処理中、エラーが分かる
  - レシピ集上部に `新規レシピ` / `テキストから追加` / `AI考案` の3ボタンが見える
  - このチケットでは既存の保存処理とAI API経路を壊さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0128/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0128-web-canvas-frame-recipe-actions
related_artifacts:
  - artifacts/TKT-0128/verify.json
  - artifacts/TKT-0128/manual-smokes.md
  - artifacts/TKT-0128/review.md
  - artifacts/TKT-0128/report.md
owner_role: implementer
owner_notes:
  - 最初に着手する推奨チケット
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 判断に迷う場合は、コード上の機能有無ではなく `canvas-ui-workflows.md` の画面導線を優先する
  - 主な変更候補は `web-mode-shell.tsx`、`recipe-meal-workspace.tsx`、`globals.css`
  - 画面土台と入口復元だけに絞り、テキスト構造化モーダルやAI考案モーダルの詳細は後続に回す
---

# Summary

Canvas版に寄せたWeb版修正の第一段階。共通フレームが崩れていると各画面の差分確認が難しいため、先に下部3ナビ、中央カラム、上部ステータス、レシピ集の3ボタンを整える。
