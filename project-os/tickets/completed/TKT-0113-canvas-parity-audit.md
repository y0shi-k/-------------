---
id: TKT-0113-canvas-parity-audit
title: Canvas版完全一致監査
status: completed
goal: Web版を「スプシ連携以外はCanvas版と同じ」にするため、未移植差分を正本化してCSV移行前に止める
acceptance:
  - `project-os/knowledge/canvas-parity-matrix.md` がCanvas版全体を基準に更新されている
  - Canvas版の在庫、登録待ち、買い物、レシピ、AI、献立、調理、料理履歴、今日ダッシュボードが比較対象に含まれている
  - Web版の実装済み/未実装/仕様差分が分類されている
  - `missing`, `changed`, `partial` の項目ごとに後続チケット候補が作られている、または作成方針が明記されている
  - `TKT-0110-csv-migration-tool` へ進めるかどうかの判定がartifactに残っている
required_evals:
  - web_project_bootstrap
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
  - ai_server_route
  - csv_import_migration
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - project-os/knowledge/canvas-parity-matrix.md
  - project-os/specs/SPEC-0113-canvas-parity-audit.md
  - project-os/tickets/TKT-0113-canvas-parity-audit.md
  - project-os/artifacts/TKT-0113/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0113-canvas-parity-audit
related_artifacts:
  - artifacts/TKT-0113/verify.json
  - artifacts/TKT-0113/manual-smokes.md
  - artifacts/TKT-0113/review.md
  - artifacts/TKT-0113/report.md
owner_role: implementer
owner_notes:
  - TKT-0109の後、TKT-0110 CSV移行の前に必ず実施する
  - このticketでは機能実装をしない
  - Canvas版 `app.html` の現行挙動を基準にする
  - スプシ/GAS/DriveだけはSupabase/Next.jsへ置換してよい
  - 完全一致に足りないものは後続チケット化する
---

# Summary

完全移植のための監査チケット。Web版MVPからCanvas版クローンへ方針を戻すため、未実装差分をすべて見える化する。

## 実施メモ

- `app.html` のDOM、主要関数、既存 `SPEC-00xx` を読んでCanvas版機能を棚卸しする。
- `web/` の実装とSupabase schemaを確認する。
- 差分を `project-os/knowledge/canvas-parity-matrix.md` に追記する。
- CSV移行はschema確定後でないとやり直しリスクが高いため、このticketの判定が終わるまで進めない。

## 次

監査結果に応じて、`TKT-0114` から `TKT-0127` に未移植機能を分解済み。CSV移行は完全一致チケット群の完了後に再判断する。
