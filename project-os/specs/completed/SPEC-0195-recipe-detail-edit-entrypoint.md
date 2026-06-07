---
id: SPEC-0195-recipe-detail-edit-entrypoint
title: レシピ詳細から既存編集モーダルを開く
status: draft
scope:
  - 全画面の調理ビュー
  - レシピカードの「料理する」導線
  - スケジュールの「調理開始」導線
  - 既存レシピ編集モーダルへの導線
constraints:
  - 新しい編集画面や保存経路は作らない
  - DB schema、Storage、AI/API は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 全画面の調理ビュー上部に「編集」ボタンがある
  - 調理ビュー上部の編集ボタンから、選択中レシピの内容が入った既存編集モーダルが開く
  - レシピカードの「料理する」とスケジュールの「調理開始」のどちらから入っても同じ編集ボタンが見える
  - レシピ一覧カードの既存編集ボタンは従来どおり動く
  - スマホでも押しやすいサイズと配置になっている
  - Web版verifyが通る
related_tickets:
  - TKT-0195-recipe-detail-edit-entrypoint
---

# Summary

調理ビューでレシピ詳細を見ながら、そのまま編集へ進めるようにする。既存の編集モーダルと保存処理を再利用し、導線だけを増やす。

## 仕様

- 対象は `web/src/components/recipe-meal-workspace.tsx` と `web/src/app/globals.css`。
- 全画面の調理ビューのヘッダーから、既存の `startEditRecipe(recipe)` を呼ぶ。
- ボタンの表示文言は「編集」。テストや支援技術で区別しやすいアクセシブル名を付ける。
- 見た目は調理ビュー上部の補助操作として控えめにし、スマホでも押しやすくする。

## 非対象

- 編集モーダルの入力項目追加
- レシピ保存ロジック変更
- レシピ画像保存処理の変更
- DB schema変更
