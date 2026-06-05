---
id: TKT-0110-csv-migration-tool
title: CSV移行ツール
status: ready_for_implementation
goal: Canvas完全一致に必要なWeb版schema確定後、既存Spreadsheet CSVをSupabaseへ安全に移行できるようにする
acceptance:
  - `scripts/` にCSV移行ツールがある
  - dry-runで移行予定件数を表示できる
  - 本実行前に対象環境を確認する安全装置がある
  - 移行後の件数確認ができる
  - 失敗時にどのCSV/行/項目で失敗したか分かる
required_evals:
  - csv_import_migration
  - supabase_schema_change
eval_selection_mode: manual
changed_paths:
  - scripts/
  - supabase/
  - project-os/artifacts/TKT-0110/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0110-csv-migration-tool
related_artifacts:
  - artifacts/TKT-0110/verify.json
  - artifacts/TKT-0110/manual-smokes.md
  - artifacts/TKT-0110/review.md
  - artifacts/TKT-0110/report.md
owner_role: implementer
owner_notes:
  - TKT-0113-canvas-parity-audit完了後、完全一致チケット群が未完了なら、このticketへ進まない
  - 少なくとも TKT-0116 / TKT-0117 / TKT-0122 / TKT-0125 はCSV移行前に完了していること
  - GASやGoogle APIを使わず、ユーザーが出力したCSVを入力にする
  - 完了後は TKT-0111 に進む
---

# Summary

データ移行チケット。チャットや手作業に頼らず、CSVからSupabaseへ再現可能に移す。

## 開始条件

- `TKT-0113-canvas-parity-audit` が完了していること。
- `project-os/knowledge/canvas-parity-matrix.md` の `missing` / `changed` が正式チケット化されていること。
- 完全一致チケット群 `TKT-0114` から `TKT-0127` のうち、schemaや移行項目に影響するものが完了していること。
- 特に `TKT-0116-storage-location-management-web`、`TKT-0117-unit-conversion-web`、`TKT-0122-cook-candidate-queue-web`、`TKT-0125-cooking-completion-consumption-web` が完了していること。
- Supabase schemaがCanvas版の必要データを失わないと確認済みであること。

## 実装メモ

- dry-runをデフォルトにする。
- 本番投入には明示フラグを必要にする。
- 件数と変換エラーをartifactに残す。

## 次

TKT-0111-pwa-mobile-polish
