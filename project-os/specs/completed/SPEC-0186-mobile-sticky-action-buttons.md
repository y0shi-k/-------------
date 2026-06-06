---
id: SPEC-0186-mobile-sticky-action-buttons
title: 主要操作ボタン（上部プラス/在庫に追加/モーダル×）をスクロール追従で固定する
status: draft
scope:
  - 食材管理ヘッダーの「＋」追加ボタン（上部 sticky）
  - 手動追加モーダルの「在庫に追加」ボタン（モーダル下部 sticky）
  - 全モーダル共通の「×」閉じるボタン（モーダルエリア右上 sticky）
constraints:
  - 触らない範囲: 各ボタンの onClick ロジック・保存処理・モーダルの開閉state
  - 横はみ出し全般（→ SPEC-0184）と食材名重なり（→ SPEC-0185）は対象外
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS のロジックは変更しない（表示のみ）
acceptance:
  - 食材管理で在庫リストを下までスクロールしても「＋」追加ボタンが常に画面内に見えて押せる。
  - 手動追加モーダルでフォームをスクロールしても「在庫に追加」ボタンがモーダル下部に固定で見えて押せる。
  - どのモーダルでも本文をスクロールしても「×」ボタンがモーダルエリア右上に残り、いつでも閉じられる。
  - sticky 化によって横はみ出しや要素重なりが新たに発生しない（SPEC-0184 を後退させない）。
  - PC幅（>=720px）でも各ボタンが従来どおり機能し、見た目が破綻しない。
  - Web版 verify（lint/typecheck/build）が通る。
related_tickets:
  - TKT-0186-mobile-sticky-action-buttons
---

# Summary

スクロールで主要操作ボタンが画面外に消えて押せなくなる問題を解消する。「＋」「在庫に追加」「×」を
それぞれ sticky 追従にして、スクロール中も常に操作できるようにする。特に「×」は `.canvas-modal`
（`overflow:auto`）内で `position:absolute` のためスクロールで一緒に流れるのを直す。

## 背景

スマホでスクロールすると、上部の追加ボタン・モーダルの保存ボタン・閉じる×ボタンが画面外へ消え、操作不能になる。ユーザーから「×がスクロールで消えると戻せない」と明示の指摘あり。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`
- 対象:
  - 「＋」: `web/src/components/inventory-board.tsx`（≈line 975-992 `.inventory-canvas-header` / `.canvas-mode-control` / `.icon-action`）→ ヘッダーまたは＋ボタンを上部 sticky に
  - 「在庫に追加」: 手動追加モーダル `.form-actions .submit-large`（inventory-board.tsx ≈1200 / globals.css `.submit-large` ≈1632）→ モーダル下部に sticky 固定
  - 「×」: `.modal-close-button`（globals.css ≈1647 `position:absolute; top:14px; right:14px`）が `.canvas-modal`（≈1558 `position:relative; overflow:auto`）内で本文と一緒にスクロールする。`position: sticky` 化、またはモーダルを「固定ヘッダー（×を含む）＋本文スクロール」構造に変更して右上に残す。全モーダル（recipe-editor/inventory-editor/add-choice/photo-scan 等）共通で効くこと。
- 対象CSS: `web/src/app/globals.css`
- 方針: sticky を使う（要望は「sticky追従で常時表示」）。z-index と背景を付けて本文と重なっても視認できるようにする。
- verify: `/verify`

## 非対象

- 横はみ出し全般（→ SPEC-0184）／食材名重なり（→ SPEC-0185）
- ボタンの動作・保存ロジック・モーダル開閉stateの変更

## Acceptance Example

- スマホ幅で各シーンを操作: 在庫リスト最下部までスクロール→＋が見える、手動追加モーダルで最下部までスクロール→在庫に追加が見える、各モーダル本文をスクロール→×が右上に残る。結果を report に記録する。
- PC幅で各ボタンが従来どおり機能することを確認する。
