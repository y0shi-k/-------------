# AGENTS.md — Stock Master（料理レシピ・食材管理アプリ）

> このファイルは、このリポジトリで作業する AI 向けの唯一の入口です。詳細は `.agents/` と `project-os/` を参照してください。

---

## 最優先ルール（要約）

- **Canvas版 `app.html` は凍結・参照専用。今後編集しない。** 過去実装の知見として読むだけ。
- 現役の正本は **Web版**（`web/` + `supabase/`）。GAS、Google Spreadsheet、Google Drive を使わず、Next.js + Supabase + Vercel で進める。
- 既存機能を壊さない。正本と生成物の境界を守る。
- 実装前は `project-os/tickets/TKT-*` を確認し、`spec_ready` + `implementation_ready` が揃うまで実装に入らない。
- APIキー、Supabase秘密鍵、写真URLなどの秘匿情報はコードに直書きしない。`.env.local` とVercel環境変数で管理する。
- 変更後は verify を実行する（`/verify` Skill）。完了報告は `project-os/artifacts/TKT-xxxx/` に残す。

## プロジェクト概要

- **名称**: Stock Master — 料理レシピ・食材管理アプリ
- **Web版（現役）**: `web/` 配下のNext.jsアプリ。Supabase Auth/DB/Storage + Vercelで運用する。GASは使わない。
- **Canvas版（凍結・参照専用）**: 単一HTMLファイル `app.html`。過去はGemini Canvas + GAS + Spreadsheet + Drive で動かしていたが、現在は編集しない参照資産。
- **開発・テストフロー（Web版）**: `web/` 内で lint / typecheck / test / build を実行し（`/verify`）、Supabase RLSとStorage権限を確認する。Vercel公開や本番DB操作は明示依頼がある場合だけ行う。
- **現状**: Web版移植を `TKT-0100` 以降で管理。Canvas版は凍結。

## 正本ファイル

- 共通: `AGENTS.md` / `.agents/` / `harness/*.json` / `project-os/` / `docs/`
- Web版（現役）: `web/` / `supabase/` / `scripts/`
- Canvas版（凍結・参照専用）: `app.html` / `要件定義書.md`

## verify

verify コマンドの正本は `harness/registry.json` と `harness/bin/verify_web.sh`（`/verify` Skill）。
ここには直書きせず、`/verify` を実行する。policy チェック（GAS漏れ・秘密直書き・RLS有無）も
`verify_web.sh` に集約されている。

Canvas版 verify は凍結済みのため参照のみ（`harness/registry.json` の `legacy_reference` 参照）。

## 詳細はこちら

- AI運用ルール: `.agents/index.md`
- 状態基盤: `project-os/index.md`
- 人向け文書: `docs/index.md`
