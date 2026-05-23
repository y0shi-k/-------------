---
id: TKT-0110-csv-migration-tool
title: CSV移行ツール
status: ready_for_implementation
goal: 既存Spreadsheet CSVをSupabaseへ安全に移行できるようにする
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
  - TKT-0109完了後に実施する
  - GASやGoogle APIを使わず、ユーザーが出力したCSVを入力にする
  - 完了後は TKT-0111 に進む
---

# Summary

データ移行チケット。チャットや手作業に頼らず、CSVからSupabaseへ再現可能に移す。

## 実装メモ

- dry-runをデフォルトにする。
- 本番投入には明示フラグを必要にする。
- 件数と変換エラーをartifactに残す。

## 次

TKT-0111-pwa-mobile-polish
