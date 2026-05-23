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
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0000-example
related_artifacts:
  - artifacts/TKT-0000-example/verify.json
  - artifacts/TKT-0000-example/manual-smokes.md
  - artifacts/TKT-0000-example/review.md
  - artifacts/TKT-0000-example/report.md
owner_role: implementer
owner_notes:
  - Canvas版 verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - Web版 verify は `cd web && npm run lint && npm run typecheck && npm run test && npm run build`
  - Canvas版でGoogle Spreadsheet への追加・更新・削除を含む場合、required_evals に `manual_bulk_sync_policy` を含める
  - Web版で個人データや写真を扱う場合、required_evals に `auth_and_rls_policy` または `photo_upload_storage` を含める
  - 任意監査は現時点では未定
---

# Summary

`required_evals` は `harness/change_evals.json` の `match_rules` と変更範囲を根拠に決める。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/`
- Canvas版正本: `app.html`, `要件定義書.md`
- Web版正本: `web/`, `supabase/`, `scripts/`
- Canvas版生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- Web版生成物: Vercelデプロイ、Supabase本番DB、Supabase Storage画像
- Canvas版 stack 固有 eval: スキーマ変更、GAS通信パターン改変、スプシ手動一括同期、UIコンポーネント追加、フェーズ移行
- Web版 stack 固有 eval: Web土台、Supabase schema、Auth/RLS、写真Storage、AIサーバーAPI、CSV移行、PWA/スマホUI
- Canvas版でスプシ変更を含む場合は、操作時に `state.pendingSync` へ積むこと、未同期状態を表示すること、`syncPendingChanges()` 以外で個別書き込み通信しないことを実装メモに残す
- Web版ではGAS/Spreadsheet/Driveを使わないこと、APIキーを直書きしないこと、RLS/Storage権限を確認することを実装メモに残す

## 残リスク
