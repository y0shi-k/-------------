---
id: SPEC-0102-supabase-project-and-env
title: Supabase接続と環境変数管理
status: spec_ready
scope:
  - web/
  - Supabase client設定
  - 環境変数テンプレート
constraints:
  - 秘密鍵の実値をコミットしない
  - service role keyをブラウザ側で使わない
  - DB schemaは TKT-0103 で扱う
acceptance:
  - Supabase browser/server clientの使い分け方が実装または文書化されている
  - `.env.example` に必要な変数名が揃っている
  - 秘密情報の直書きがない
  - Web版verifyが通る
related_tickets:
  - TKT-0102-supabase-project-and-env
---

# Summary

Web版からSupabaseへ安全に接続するための環境変数とclient初期化を整える。

## 非対象

- テーブル作成
- RLS policy作成
- ログイン画面実装
