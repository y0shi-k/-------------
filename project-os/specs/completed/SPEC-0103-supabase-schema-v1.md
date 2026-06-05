---
id: SPEC-0103-supabase-schema-v1
title: Supabase schema v1
status: spec_ready
scope:
  - supabase/
  - Web版DB schema
  - RLS方針
constraints:
  - Canvas版Spreadsheet schemaは変更しない
  - 個人データを持つテーブルはRLS必須
  - 写真Storageは公開バケットにしない
acceptance:
  - 在庫、登録待ち、買い物、レシピ、献立、料理履歴、写真のテーブル方針がmigrationにある
  - 本人データに限定するRLS policyがある
  - Storage bucketと写真アクセス方針が定義されている
  - migrationを読めばCSV移行先が分かる
related_tickets:
  - TKT-0103-supabase-schema-v1
---

# Summary

Canvas版の5シート構造をWeb版のSupabase schemaへ置き換える。完全一致ではなく、Webアプリとして保守しやすいテーブルへ分ける。

## 非対象

- CSV投入
- 画面実装
- 認証UI
