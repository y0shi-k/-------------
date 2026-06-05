---
id: TKT-0105-inventory-and-staging-web
title: 在庫と登録待ちのWeb版移植
status: ready_for_implementation
goal: Web版で在庫管理の最小ワークフローを使えるようにする
acceptance:
  - 在庫一覧、登録待ち一覧がある
  - 登録待ちを手動追加できる
  - 登録待ちを編集して在庫へ確定できる
  - 削除や編集後にSupabase上の本人データだけが更新される
  - Web版verifyが通る
required_evals:
  - auth_and_rls_policy
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0105/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0105-inventory-and-staging-web
related_artifacts:
  - artifacts/TKT-0105/verify.json
  - artifacts/TKT-0105/manual-smokes.md
  - artifacts/TKT-0105/review.md
  - artifacts/TKT-0105/report.md
owner_role: implementer
owner_notes:
  - TKT-0104完了後に実施する
  - 写真ボタンはプレースホルダーにしてよいが、実処理は TKT-0106 まで入れない
  - 完了後は TKT-0106 に進む
---

# Summary

在庫管理の基本チケット。Web版の最初の実用画面として、手動登録から在庫化までを作る。

## 実装メモ

- Canvas版の「登録待ちで確認してから確定する」考え方を維持する。
- Web版では保存操作ごとにSupabaseへ反映する。
- スマホ片手操作を優先し、主要ボタンを見つけやすくする。

## 次

TKT-0106-mobile-photo-capture-upload
