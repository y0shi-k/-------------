---
id: SPEC-0100-web-migration-governance
title: Web移植に向けたAGENTS/ハーネス運用整備
status: spec_ready
scope:
  - AGENTS.md
  - .agents/
  - harness/
  - project-os/knowledge/
constraints:
  - Webアプリ本体はまだ実装しない
  - 現行Canvas版の `app.html` は変更しない
  - Canvas版の既存verifyとGAS/Spreadsheetルールは残す
  - Web版ではGAS、Google Spreadsheet、Google Driveを使わない
acceptance:
  - Canvas版とWeb版の正本・生成物・verifyが分離されている
  - Web版の標準構成が Next.js + Supabase + Vercel として明記されている
  - Web版でAPIキーやSupabase秘密鍵を直書きしないルールが明記されている
  - Web版の停止条件にRLS未設定、ログインなし閲覧、公開Storage、build失敗が含まれている
  - Web版用evalが `harness/change_evals.json` に追加されている
  - Web版移植チケットの分解と実施順序が `project-os/knowledge/web-migration-map.md` に残っている
related_tickets:
  - TKT-0100-web-migration-governance
---

# Summary

このspecは、Canvas版 Stock Master を維持しながらWeb版を同じリポジトリで新設するための運用ルールを定義する。Web版そのものの実装は対象外であり、まずAIが迷わず次チケットを進められる状態を作る。

## 背景

現行リポジトリのハーネスは `app.html`、GAS、Google Spreadsheet、Google Driveを前提にしている。Web版はNext.js、Supabase、Vercelへ移すため、Canvas版のルールをそのまま適用すると、GAS前提のverifyやスプシ同期ルールがWeb版に混ざってしまう。

## 仕様

- 共通正本は `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/` とする。
- Canvas版正本は `app.html`, `要件定義書.md` とする。
- Web版正本は `web/`, `supabase/`, `scripts/` とする。
- Canvas版verifyは既存のHTML/GAS確認を使う。
- Web版verifyは `cd web && npm run lint && npm run typecheck && npm run test && npm run build` とする。
- Web版ではGAS、Google Spreadsheet、Google Driveを使わない。
- Web版のAPIキー、Supabase秘密鍵、DBパスワード、写真URLは正本に実値を書かない。
- Web版ではSupabase RLS、ログイン保護、Storage非公開を必須の安全条件にする。
- Web版ticketは `TKT-0100` 以降を使い、Canvas版ticketと混ぜない。

## 非対象

- `web/` のNext.js初期化
- Supabase migration作成
- Vercel公開
- CSV移行スクリプト作成
- 既存 `app.html` の機能修正
