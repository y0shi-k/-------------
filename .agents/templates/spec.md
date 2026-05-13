---
id: SPEC-0000-example
title: 変更仕様のタイトル
status: draft
scope:
  - 対象画面や対象機能
constraints:
  - 触らない範囲
  - Google Spreadsheet への追加・更新・削除を含む場合、操作時は即時通信せず `state.pendingSync` に積み、`syncPendingChanges()` の手動一括同期で反映する
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
- スプシ変更ポリシー: 初期読込/承認を除く書き込み系は `state.pendingSync` + `syncPendingChanges()` に集約し、個別 `executeGAS(payload...)` を増やさない

## 非対象

## Acceptance Example

- 関連 ticket の `required_evals` と矛盾しない acceptance を書く
- `project-os/artifacts/TKT-xxxx/` を見れば達成可否を判定できる状態にする
- スプシ変更を含む場合は、操作直後は未同期表示になり、同期ボタン後にSpreadsheetへ反映されることを acceptance に含める
