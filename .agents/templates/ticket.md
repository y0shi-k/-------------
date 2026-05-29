---
id: TKT-0000-example
title: 実装タスクのタイトル
status: draft
goal: 何を防ぐための変更か
acceptance:
  - 完了条件1
required_evals:
  - example_eval
eval_selection_mode: auto
changed_paths:
  - web/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0000-example
related_artifacts:
  - artifacts/TKT-0000-example/verify.json
  - artifacts/TKT-0000-example/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify <TKT>`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
  - required_evals は `/check-gates` で diff から自動判定できる。迷ったら一度実行して match を確認する
  - 既定の必須成果物は verify.json + report.md。危険変更時のみ manual-smokes.md / review.md を追加し、required_gates に manual_smokes_done / review_ready を足す
  - 危険変更 = `auth_and_rls_policy` / `supabase_schema_change` / `photo_upload_storage` / `ai_server_route` / `csv_import_migration`
---

# Summary

`required_evals` は `harness/change_evals.json` の `match_rules`（active のみ）と変更範囲を根拠に決める。`/check-gates` が自動判定する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/`
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）
- Web版生成物: Vercelデプロイ、Supabase本番DB、Supabase Storage画像
- Web版 stack 固有 eval: Web土台、Supabase schema、Auth/RLS、写真Storage、AIサーバーAPI、CSV移行、PWA/スマホUI
- Web版ではGAS/Spreadsheet/Driveを使わないこと、APIキーを直書きしないこと、RLS/Storage権限を確認することを実装メモに残す

## 残リスク
