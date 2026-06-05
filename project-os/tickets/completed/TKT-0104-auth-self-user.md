---
id: TKT-0104-auth-self-user
title: 自分だけログイン
status: ready_for_implementation
goal: Web版の個人データを守るため、ログイン保護を実装する
acceptance:
  - ログイン/ログアウト導線がある
  - 未ログインで保護ページを開くとログイン画面へ誘導される
  - ログイン後だけアプリ本体を表示する
  - Supabase RLSと矛盾しないuser_id設計になっている
  - Web版verifyが通る
required_evals:
  - auth_and_rls_policy
  - web_project_bootstrap
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0104/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0104-auth-self-user
related_artifacts:
  - artifacts/TKT-0104/verify.json
  - artifacts/TKT-0104/manual-smokes.md
  - artifacts/TKT-0104/review.md
  - artifacts/TKT-0104/report.md
owner_role: implementer
owner_notes:
  - TKT-0103完了後に実施する
  - 自分だけログインを最小実装する
  - 完了後は TKT-0105 に進む
---

# Summary

認証チケット。業務機能より先に、ログインなしでデータが見えない状態を作る。

## 実装メモ

- UIは簡素でよいが、スマホで入力しやすくする。
- 保護ページ側でセッション確認を行う。
- RLSと組み合わせて二重に守る。

## 次

TKT-0105-inventory-and-staging-web
