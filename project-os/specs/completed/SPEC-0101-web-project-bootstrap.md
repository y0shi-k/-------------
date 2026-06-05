---
id: SPEC-0101-web-project-bootstrap
title: Web版Next.js土台作成
status: spec_ready
scope:
  - web/
  - Web版の最小アプリ構成
constraints:
  - `app.html` は変更しない
  - Supabase実接続やDB schemaは TKT-0102/TKT-0103 で扱う
  - GAS、Google Spreadsheet、Google Driveを使わない
acceptance:
  - `web/` にNext.js + TypeScriptの最小構成がある
  - lint、typecheck、test、buildのnpm scriptsが定義されている
  - `.env.example` に必要な環境変数名だけがあり、実値がない
  - 初期画面はスマホ幅で崩れない
related_tickets:
  - TKT-0101-web-project-bootstrap
---

# Summary

Web版の空の器を作る。機能実装ではなく、以後のSupabase接続、認証、写真取り込みを安全に積めるNext.jsプロジェクトを用意する。

## 非対象

- Supabase schema作成
- ログイン実装
- 在庫・レシピなどの業務機能
- Vercel本番公開
