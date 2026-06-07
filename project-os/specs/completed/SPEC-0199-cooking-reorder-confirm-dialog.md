---
id: SPEC-0199-cooking-reorder-confirm-dialog
title: 全画面ビューの「並び替えを確定」前に確認メッセージを出す
status: draft
scope:
  - 全画面ビュー（CookingViewer）下部の `並び替えを確定` ボタン
  - 確定前の確認UI
constraints:
  - 確認UIはアプリ既存の確認パターンに合わせる（Web版方針に従う）
  - 確認OK時のみ既存 `saveCookingReorder` を実行する
  - 並び替えロジック・保存対象カラムは変更しない
  - DB schema、Storage、AI/API、auth/RLS は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - `並び替えを確定` を押すと、保存前に確認メッセージが表示される
  - 確認でOK（確定）を選ぶと、従来どおり `saveCookingReorder` でレシピ本体へ保存される
  - 確認でキャンセルを選ぶと、保存されず未確定の並び替えがそのまま残る
  - 未確定の並び替えが無い時は確定ボタンが従来どおり無効のまま（確認も出ない）
  - 既存のUndo/Redo・料理完了フローは壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0199-cooking-reorder-confirm-dialog
---

# Summary

全画面ビューの「並び替えを確定」は現在、押すと確認なしで即保存される。誤操作でレシピ本体の並びを書き換えてしまうのを防ぐため、確定前に確認メッセージを挟む。

## 背景

TKT-0197 で実装した確定ボタン（`saveCookingReorder`、~L1703 / ボタン ~L2105）は確認なしで即 DB 保存する。レシピ本体への永続変更なので確認を入れたいという要望。

## 仕様

- 対象は `web/src/components/recipe-meal-workspace.tsx`（確定ボタン ~L2105、`saveCookingReorder` ~L1703）。必要に応じて `globals.css`。
- 確認UIは、未確定で料理完了しようとした時に既に使っている確認パターン（TKT-0197 で導入済み）と同じ方式に合わせる。新しいダイアログ機構を増やさない。
- 確認OK時のみ `saveCookingReorder` を呼ぶ。キャンセル時は state を変えない。

## 非対象

- 並び替えロジック・保存対象カラムの変更
- 編集画面側の確認（編集画面は既存の保存フロー）
- DB schema変更
