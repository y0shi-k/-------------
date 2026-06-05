---
id: SPEC-0010-syncbar-top-statusbar
title: 未同期バーの上部ステータスバー化
status: ready
scope:
  - syncBar の位置・表示制御
  - main#app のパディング
  - モーダル開閉時の syncBar 連動制御
constraints:
  - スプシ同期ロジックは変更しない
  - ボタン配置・デザインは変更しない
  - 既存の updateSyncBar() の判定ロジックは変更しない
acceptance:
  - syncBar が画面上部に表示される
  - 表示/非表示でコンテンツが上下にずれない（pt-14 でスペース確保）
  - 下部の一括削除ボタン・モーダルボタンと一切重ならない
  - モーダル開催中は未同期バーが隠れる（TKT-0009 の機能維持）
  - verify がパスする
related_tickets:
  - TKT-0010-syncbar-top-statusbar
  - TKT-0009-syncbar-modal-overlap
---

# Summary

下部に表示されていた未同期バー（#syncBar）が、下部固定ボタン（一括削除等）やモーダルのボタンと重なる問題が継続している。根本解決として、未同期バーを画面上部のステータスバーへ移行し、スペースをあらかじめ確保する。

## 背景

- 現状: syncBar は `bottom-24` で表示。下部の一括削除ボタン（赤いボタン）やモーダルのボタンと重なる
- TKT-0009 でモーダル開催中のみ隠す対応をしたが、通常画面の下部ボタンとは依然として重なる

## 仕様

### 位置変更
- 旧: `fixed left-3 right-3 bottom-24 z-[60]`
- 新: `fixed top-0 left-0 right-0 z-[70]`

### スペース確保
- `<main id="app">` に `pt-14`（56px）を追加
- syncBar の高さ分を常に確保し、表示/非表示でコンテンツがずれない

### 表示アニメーション
- `translateY(-100%)` で上にスライドアウト
- `translateY(0)` でスライドイン
- `transition-transform duration-300` でスムーズ

### 表示制御変更
- `updateSyncBar()`: `hidden` class の add/remove → `.sync-bar-hidden` / `.sync-bar-visible` 切り替え
- モーダル関数: `classList.add('hidden')` → `classList.add('sync-bar-hidden')` + `classList.remove('sync-bar-visible')`

### 対象モーダル（TKT-0009 と同一）
- itemModal, recipeModal, recipeTextModal
- aiRequestModal, aiIngredientSelectModal, aiRecipePreviewModal
- scheduleRecipeModal, scheduleSlotMenu

## 非対象

- スプシ同期ロジック
- ボタンのデザイン・配置
- ステータスバー（#statusBar）

## Acceptance

- [ ] syncBar が画面上部に固定表示される
- [ ] 非表示時も main の pt-14 によりコンテンツ位置が変わらない
- [ ] 下部ボタン（一括削除等）と重ならない
- [ ] モーダル開催中は syncBar が隠れる
- [ ] verify がパスする
