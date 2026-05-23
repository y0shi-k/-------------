---
id: TKT-0112-production-release-checklist
title: 本番公開前チェック
status: ready_for_implementation
goal: Web版をVercel公開できる状態か、安全面と動作面を最終確認する
acceptance:
  - Vercel環境変数チェックリストがある
  - Supabase RLS確認結果がある
  - Supabase Storageが公開バケットでない確認結果がある
  - `npm run build` が通る
  - iPhone/Android/タブレットの手動確認項目がある
  - 公開する/しないの人判断ポイントが明記されている
required_evals:
  - auth_and_rls_policy
  - photo_upload_storage
  - pwa_mobile_ui
  - web_project_bootstrap
eval_selection_mode: manual
changed_paths:
  - web/
  - supabase/
  - docs/
  - project-os/artifacts/TKT-0112/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0112-production-release-checklist
related_artifacts:
  - artifacts/TKT-0112/verify.json
  - artifacts/TKT-0112/manual-smokes.md
  - artifacts/TKT-0112/review.md
  - artifacts/TKT-0112/report.md
owner_role: implementer
owner_notes:
  - TKT-0111完了後に実施する
  - このticketは公開前確認であり、デプロイ実行はユーザーの明示依頼がある場合だけ行う
---

# Summary

リリース前チェックチケット。公開前に、秘密情報・DB保護・写真保護・スマホ実機確認をまとめて確認する。

## 実装メモ

- 「公開してよい状態」と「まだ危険な状態」を分けて報告する。
- 本番環境を触る操作は事前にユーザー確認を取る。
- チェック結果はartifactに残す。

## 次

Web版v1公開判断。追加改善は新しい `TKT-0113` 以降で管理する。
