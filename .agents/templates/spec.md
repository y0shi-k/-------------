---
id: SPEC-0000-example
title: 変更仕様のタイトル
status: draft
scope:
  - 対象画面や対象機能
constraints:
  - 触らない範囲
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS を扱う場合は、ログイン必須・Supabase RLS・Storage非公開・APIキー非露出を守る
acceptance:
  - 受け入れ条件1
related_tickets:
  - TKT-0000-example
---

# Summary

この spec は、reviewer が会話ではなく `project-os/` だけを読んで判断できる状態を作るための正本。

## 背景

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/`
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）
- Web版生成物: Vercelデプロイ、Supabase本番DB、Supabase Storage画像
- verify: `/verify`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
- Web版ポリシー: GAS/Spreadsheet/Driveを使わず、Next.js + Supabase + Vercelで実装する。APIキーや秘密鍵は環境変数で管理する。

## 非対象

## Acceptance Example

- 関連 ticket の `required_evals` と矛盾しない acceptance を書く
- `project-os/artifacts/TKT-xxxx/` を見れば達成可否を判定できる状態にする
- Web版で個人データや写真を扱う場合は、ログイン、Supabase RLS、Storage非公開、APIキー非露出を acceptance に含める
