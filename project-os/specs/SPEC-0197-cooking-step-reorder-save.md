---
id: SPEC-0197-cooking-step-reorder-save
title: 調理ビューで手順・材料を並び替えてレシピ本体へ保存する
status: draft
scope:
  - 調理ビュー右ペインの手順カード
  - 調理ビュー左ペインの材料・調味料カード
  - 下ごしらえ / 調理工程の区分またぎ移動
  - 並び替え確定ボタンと調理完了ボタンの分離
constraints:
  - 保存確定まではDBへ反映しない
  - 手順保存対象は既存の `recipes.prep_steps` / `recipes.steps`
  - 材料保存対象は既存の `recipe_ingredients.sort_order` / `recipe_ingredients.item_type`
  - 献立、料理履歴、消費履歴は変更しない
  - DB schema、Storage、AI/API は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 調理ビュー右ペインの手順カードをドラッグ&ドロップで並び替えできる
  - 調理ビュー左ペインの材料・調味料カードをドラッグ&ドロップで並び替えできる
  - 下ごしらえと調理工程をまたいで移動できる
  - 材料と調味料をまたいで移動できる
  - 行左側に3本線のドラッグハンドルが表示される
  - Undo / Redo で直前の並び替え操作を戻せる
  - 移動した行は未確定中に色付き枠で分かる
  - 調理ビュー下部に `並び替えを確定` と `料理を完了する` が分かれて表示される
  - `並び替えを確定` で `recipes.prep_steps` / `recipes.steps` に保存される
  - 材料・調味料の並び替えは `recipe_ingredients.sort_order` / `recipe_ingredients.item_type` に保存される
  - 未保存の並び替えがある状態で調理完了へ進む時は確認を出す
  - 調理完了済みでも並び替え保存はできる
  - 既存の消費量確認、料理履歴保存、在庫減算は壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0197-cooking-step-reorder-save
---

# Summary

調理中に手順や材料の順番・分類を変えたくなった時、編集画面へ戻らず調理ビュー上で一時変更し、確定時にレシピ本体へ保存できるようにする。

## 仕様

- 対象は `web/src/components/recipe-meal-workspace.tsx` と `web/src/app/globals.css`。
- 手順は画面内の一時stateとして保持し、未確定状態を判定する。
- 材料・調味料も画面内の一時stateとして保持し、未確定状態を判定する。
- D&DはHTML5 Drag and Drop APIを使い、行左側の3本線ハンドルを操作目印にする。
- Undo / Redo 用に画面内履歴を持つ。
- 手順保存時は `recipes` テーブルの `prep_steps` と `steps` を更新する。
- 材料保存時は `recipe_ingredients` テーブルの `sort_order` と `item_type` を更新する。
- 未確定のまま調理完了しようとした場合は、保存してから既存の調理完了フローへ進むか確認する。
- 保存エラーは「原因」「影響」「修正方法」が分かるメッセージにする。

## 非対象

- レシピ編集モーダル側のD&D再実装
- DB schema変更
- 工程別消費量の分割管理
