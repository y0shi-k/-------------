---
id: SPEC-0110-csv-migration-tool
title: CSV移行ツール
status: spec_ready
scope:
  - scripts/
  - supabase/
  - Spreadsheet CSV
constraints:
  - 本番DBへ誤投入しない安全装置を入れる
  - dry-runを優先する
  - 秘密鍵をスクリプトへ直書きしない
acceptance:
  - CSVを読み込んで移行前件数を確認できる
  - dry-runで投入予定件数を確認できる
  - Supabaseへ投入できる
  - 失敗時に原因が分かるログが出る
related_tickets:
  - TKT-0110-csv-migration-tool
---

# Summary

既存SpreadsheetからCSV出力したデータをSupabaseへ移すための一回限りの移行ツールを作る。

## 非対象

- Google APIでの自動取得
- GAS利用
- 本番投入の自動実行
