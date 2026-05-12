---
id: SPEC-0000-example
title: 変更仕様のタイトル
status: draft
scope:
  - 対象画面や対象機能
constraints:
  - 触らない範囲
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
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`

## 非対象

## Acceptance Example

- 関連 ticket の `required_evals` と矛盾しない acceptance を書く
- `project-os/artifacts/TKT-xxxx/` を見れば達成可否を判定できる状態にする
