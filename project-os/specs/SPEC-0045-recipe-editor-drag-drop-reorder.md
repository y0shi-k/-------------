---
id: SPEC-0045-recipe-editor-drag-drop-reorder
title: レシピ編集画面の材料・調味料・工程をドラッグ＆ドロップで並び替え
status: ready
scope:
  - レシピ編集モーダル（recipeModal）内の材料入力リスト（ingredientList）
  - 調味料入力リスト（seasoningList）
  - 下ごしらえ入力リスト（prepStepList）
  - 調理工程入力リスト（cookStepList）
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - 既存レシピデータに影響なし
  - HTML5 Drag and Drop API を使用（タッチデバイス対応は別途検討）
acceptance:
  - 材料行がドラッグハンドルを持ち、D&Dで順序変更可能
  - 調味料行がドラッグハンドルを持ち、D&Dで順序変更可能
  - 下ごしらえ行がドラッグハンドルを持ち、D&Dで順序変更可能（連番自動更新）
  - 調理工程行がドラッグハンドルを持ち、D&Dで順序変更可能（連番自動更新）
  - 上下移動ボタンがすべて削除されている
  - D&D後に保存すると、変更後の順序が正しくJSONに反映される
  - verify が PASS すること
related_tickets:
  - TKT-0045-recipe-editor-drag-drop-reorder
---

# Summary

レシピ編集モーダル内の4セクションの各行をドラッグ＆ドロップで並び替え可能にし、上下ボタンを削除して UI をスッキリさせる。

## 背景

TKT-0042 で材料・調味料・下ごしらえ・調理工程の4セクションを分離したが、各行の並び替えに上下ボタン（↑↓）を使っていた。項目が増えるとボタンが目立ち、操作も煩雑になるため、直感的なドラッグ＆ドロップに置き換える。

## 仕様

### ドラッグハンドルの配置

- **材料・調味料行**：行の先頭に ≡（グリップ）アイコンを配置。`cursor-grab` / `cursor-grabbing` で視覚的フィードバック
- **下ごしらえ・調理工程行**：連番バッジ（丸い数字）自体をドラッグハンドルにする

### ドラッグ＆ドロップ動作

- ドラッグ開始時：行に `.dragging` クラスを付与（opacity: 0.4）
- ドラッグオーバー時：ドロップ位置の行に `.drag-over-top` クラスを付与（border-top: 2px solid #6366f1）
- ドロップ時：DOM を移動し、`.drag-over-top` を解除
- ドロップ後：工程行は `renumberCookSteps()` / `renumberPrepSteps()` で連番を再採番

### 上下ボタンの削除

- `renderIngredientInputs` / `addIngredientRow` / `renderSeasoningInputs` / `addSeasoningRow` から上下ボタンを削除
- `moveRecipeItemRow()` 関数を削除

### 実装詳細

- `initRecipeDragDrop(containerId, rowSelector, afterDrop)` を新規作成
  - コンテナに dragstart / dragend / dragover / drop のイベントリスナーを設定
  - `_dragInited` フラグで重複登録を防止
  - drop 時に `afterDrop` コールバックを実行（工程行の連番再採番用）
- スタイル追加：`.dragging` / `.drag-over-top` / `.drag-handle`
- `handleInit()` の最後で各セクションに `initRecipeDragDrop()` を呼び出し

## 非対象

- タッチデバイス（スマホ・タブレット）での独自タッチイベント実装
- 他モーダルや画面での D&D 並び替え
