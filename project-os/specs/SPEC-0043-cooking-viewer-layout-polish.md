---
id: SPEC-0043-cooking-viewer-layout-polish
title: 料理中レシピビューアの2カラム化と材料チップ強調
status: ready
scope:
  - 料理ビューア（cookingViewer）
  - レシピ追加/編集モーダルの材料・調味料入力
  - AIレシピ生成・テキスト解析プロンプト
  - 料理完了前の消費量調整に渡す材料順
constraints:
  - スプレッドシート列は追加・削除しない
  - 既存レシピJSONは後方互換で扱う
  - 初期化以外の書き込みは `state.pendingSync` + `syncPendingChanges()` に集約し、個別即時GAS通信を増やさない
acceptance:
  - 料理ビューアで材料と手順が同時表示される
  - 材料・調味料は `group` ごとに見出し付きで表示される
  - 大さじは赤系、小さじは青系、食材は緑系、調味料は黄系で表示される
  - 手順文中の登録済み材料名・調味料名がチップ化される
  - チップクリックで材料欄の該当行が一時ハイライトされる
  - レシピ編集で材料・調味料行の上下移動とグループ入力ができ、保存JSONに `type` / `group` / `order` が入る
  - AI生成・テキスト解析プロンプトが `type` / `group` / `order` を要求する
related_tickets:
  - TKT-0043-cooking-viewer-layout-polish
---

# Summary

料理中の視認性を上げるため、材料と手順を分離タブから同時表示へ変更する。材料・調味料の分類、グループ、調理手順順の並びをレシピJSON内に保持し、手順文では該当語をチップ化する。

## 仕様

- `ingredients` / `seasonings` の各要素は `{ name, amount, unit, type, group, order }` を持てる
- 旧形式 `{ name, amount, unit }` は読み込み時に `type` と `order` を補完し、`group` は空文字として扱う
- 料理ビューアは広い画面で `材料:手順 = 約38:62` の2カラム、狭い画面では縦積みにする
- レシピ編集モーダルの材料・調味料行に上下ボタンとグループ入力を追加する
- 手順チップはDOM内ボタンとして描画し、クリック時に材料欄の該当行へ `cooking-ingredient-focus` を付与する

## 非対象

- 献立スケジュール、買い物リスト、料理履歴のデータ構造変更
- 既存スプレッドシート列の追加・削除
- 自然言語解析による材料自動抽出の完全対応
