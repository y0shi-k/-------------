---
id: SPEC-0192-inventory-category-filter-card-ui
title: 食材管理一覧にカテゴリフィルタを追加しカード表示を整える
status: draft
scope:
  - 食材管理画面の在庫一覧
  - All / 材料 / 調味料カテゴリフィルタ
  - 在庫カードの高さ、行揃え、食材名表示
constraints:
  - DB schema、AI/API、Storage は変更しない
  - 在庫の保存・削除・数量変更ロジックは変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 在庫一覧に `All`, `材料`, `調味料` のフィルタボタンがある
  - `All` は全在庫、`材料` は category `食材`、`調味料` は category `調味料` を表示する
  - 保存場所タブ、期限フィルタ、並び替えと同時に使える
  - カードの高さ・主要行が揃い、メモや期限の有無で見た目が大きく崩れない
  - 食材名は1行固定で、省略表示または安全な横スクロール演出になる
  - スマホ幅で横はみ出し・文字重なりが発生しない
  - Web版verifyが通る
related_tickets:
  - TKT-0192-inventory-category-filter-card-ui
---

# Summary

食材管理の一覧を見やすくする。調理詳細画面と同じ考え方でカテゴリを切り替え、カードは情報量の違いで行が不揃いにならないよう整える。

## 仕様

- 対象は `web/src/components/inventory-board.tsx` と `web/src/app/globals.css`。
- 既存の `inventoryFilters.category` を使う。
- 表示ラベルは `All`, `材料`, `調味料`。
- 長い食材名は1行固定。まずは ellipsis を優先し、余裕があればCSSアニメーションで横スクロール表現を追加する。

## 非対象

- 在庫データ構造の変更
- AI候補編集フロー（TKT-0191）
- 0在庫履歴（TKT-0194）
