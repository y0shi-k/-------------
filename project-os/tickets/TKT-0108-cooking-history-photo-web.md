---
id: TKT-0108-cooking-history-photo-web
title: 料理履歴と完成写真のWeb版移植
status: ready_for_implementation
goal: Web版で料理履歴と完成写真を記録・閲覧できるようにする
acceptance:
  - 料理履歴一覧がある
  - 履歴を追加できる
  - 完成写真を添付できる
  - 写真付き/写真なしをどちらも表示できる
  - 写真Storageが非公開前提で保たれている
  - Web版verifyが通る
required_evals:
  - photo_upload_storage
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0108/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0108-cooking-history-photo-web
related_artifacts:
  - artifacts/TKT-0108/verify.json
  - artifacts/TKT-0108/manual-smokes.md
  - artifacts/TKT-0108/review.md
  - artifacts/TKT-0108/report.md
owner_role: implementer
owner_notes:
  - TKT-0107完了後に実施する
  - 写真アップロード処理はTKT-0106の共通処理を再利用する
  - 完了後は TKT-0109 に進む
---

# Summary

料理履歴チケット。完成写真を後から見返せる状態にする。

## 実装メモ

- 写真が取れない/表示できない場合も履歴本文は失わない。
- 写真表示には署名付きURLなど非公開前提の方法を使う。

## 次

TKT-0109-recipes-and-meal-schedule-web
