---
id: TKT-0192-inventory-category-filter-card-ui
title: 食材管理一覧のカテゴリフィルタとカードUI整備
status: implementation_ready
goal: 食材管理画面に All / 材料 / 調味料 フィルタを追加し、在庫カードの高さ・行・食材名表示を整えて見やすくする。
acceptance:
  - 在庫一覧に `All`, `材料`, `調味料` のカテゴリフィルタが表示される
  - `材料` は category `食材`、`調味料` は category `調味料` で絞り込む
  - カテゴリフィルタは保存場所タブ・期限フィルタ・並び替えと併用できる
  - カードの高さ・主な行が揃い、メモや期限の有無で不揃いに見えない
  - 食材名は1行固定で、長い名前は省略表示を基本にする
  - 可能なら長い名前に横スクロール風の軽い演出を入れる。ただしスマホで読みにくい場合は省略表示を優先する
  - スマホ幅で横はみ出しや文字重なりがない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0192-inventory-category-filter-card-ui/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0192-inventory-category-filter-card-ui
related_artifacts:
  - artifacts/TKT-0192-inventory-category-filter-card-ui/verify.json
  - artifacts/TKT-0192-inventory-category-filter-card-ui/report.md
owner_role: implementer
owner_notes:
  - 非危険なUI変更。schema/Auth/RLS/Storage/AI は触らない。
  - `InventoryFilters.category` は既にあるが、UIから使われていない。これを在庫一覧のフィルタボタンへ接続する。
  - 調理ビューのカテゴリタブ（`recipe-meal-workspace.tsx` の All/材料/調味料）を見た目・ロジックの参考にする。
  - カード調整は `stock-item`, `item-title-row`, `item-main h4`, `item-note`, `quantity-stepper` 周辺を中心に小さく行う。
  - 食材名アニメーションは必須ではない。崩れやすい場合は1行ellipsisで完了してよい。
  - verify は `/verify TKT-0192-inventory-category-filter-card-ui`。
---

# Summary

在庫一覧にカテゴリフィルタを追加し、カードの見た目を揃える。機能ロジックは既存の `category` を使い、UI中心の小さな変更にする。

## 実装メモ

- 対象:
  - `web/src/components/inventory-board.tsx`
  - `web/src/app/globals.css`
- テスト:
  - `All` / `材料` / `調味料` の表示切替
  - 保存場所タブや並び替えとの併用

## 非対象

- 在庫保存ロジック
- AI解析
- DB変更
