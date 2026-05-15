---
id: SPEC-0009-syncbar-modal-overlap
title: 未同期バーとモーダルの重なり回避
status: ready
scope:
  - 全モーダルの開閉制御
  - 未同期バー（#syncBar）の表示制御
constraints:
  - モーダルのレイアウト（position, z-index, padding 等）は変更しない
  - syncBar の位置（bottom-24, z-[60]）は変更しない
  - スプシ同期ロジックは変更しない
acceptance:
  - いずれかのモーダルが開いた際、syncBar が自動的に非表示になる
  - モーダルを閉じた際、未同期件数が 0 でなければ syncBar が自動的に再表示される
  - 既存の updateSyncBar() 動作は維持される
related_tickets:
  - TKT-0009-syncbar-modal-overlap
---

# Summary

未同期バー（#syncBar）は `fixed bottom-24 z-[60]` で表示されており、各モーダル（`z-50`）より手前に存在する。モーダル内の下部ボタンと syncBar が重なり、操作性を損なうことがある。

## 背景

- syncBar: `fixed left-3 right-3 bottom-24 z-[60]`
- 各モーダル: `fixed inset-0 z-50 flex items-center justify-center p-4`
- モーダル内のコンテンツは画面中央〜下部に配置され、モーダルの `p-4` と syncBar の `bottom-24` の間隔が不十分な場合に重なる

## 仕様

- モーダルが開く際、`updateSyncBar()` を呼んで syncBar を非表示にする（未同期件数が 0 の場合は元から非表示）
- モーダルを閉じる際、`updateSyncBar()` を呼んで未同期件数に応じて再表示する
- 対象モーダルは以下8つ:
  1. itemModal（食材追加/編集）
  2. recipeModal（レシピ追加/編集）
  3. recipeTextModal（レシピテキスト入力）
  4. aiRequestModal（AIレシピリクエスト）
  5. aiIngredientSelectModal（AI材料選択）
  6. aiRecipePreviewModal（AIレシピプレビュー）
  7. scheduleRecipeModal（献立レシピ選択）
  8. scheduleSlotMenu（献立スロットメニュー）

## 非対象

- syncBar の表示位置・デザイン変更
- モーダルのレイアウト変更
- スプシ同期ロジック

## Acceptance

- [ ] 各モーダルを開くと syncBar が非表示になる
- [ ] 各モーダルを閉じると、未同期がある場合 syncBar が再表示される
- [ ] verify コマンドがパスする
