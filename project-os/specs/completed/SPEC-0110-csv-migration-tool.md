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
  - TKT-0113-canvas-parity-audit と完全一致チケット群のschema影響分が完了するまで開始しない
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

## 前提

CSV移行はWeb版schemaと機能範囲が固まってから行う。`TKT-0113-canvas-parity-audit` でCanvas版との差分を確認し、`TKT-0114` から `TKT-0127` の完全一致チケットで必要なschema影響を解消してから開始する。

特に保存場所、単位換算、作りたい候補、調理完了時の在庫消費はCSV移行項目に影響するため、先に完了させる。

## 非対象

- Google APIでの自動取得
- GAS利用
- 本番投入の自動実行
