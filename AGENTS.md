# AGENTS.md — Stock Master（料理レシピ・食材管理アプリ）

> このファイルは、このリポジトリで作業する AI 向けの唯一の入口です。詳細は `.agents/` と `project-os/` を参照してください。

---

## 最優先ルール（要約）

- 既存機能を壊さない。正本と生成物の境界を守る。
- 実装前は `project-os/tickets/TKT-*` を確認し、`spec_ready` + `implementation_ready` が揃うまで実装に入らない。
- 変更後は verify を実行する。完了報告は `project-os/artifacts/TKT-xxxx/` に残す。

## プロジェクト概要

- **名称**: Stock Master — 料理レシピ・食材管理アプリ
- **形式**: 単一HTMLファイルをGeminiCanvasアプリとしてプレビュー
- **現状**: Phase 1（DB構築＋モードA）実装中

## 正本ファイル

- `app.html` / `要件定義書.md` / `AGENTS.md` / `.agents/` / `harness/*.json`

## verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

## 詳細はこちら

- AI運用ルール: `.agents/index.md`
- 状態基盤: `project-os/index.md`
- 人向け文書: `docs/index.md`
