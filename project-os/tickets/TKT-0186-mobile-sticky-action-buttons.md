---
id: TKT-0186-mobile-sticky-action-buttons
title: 主要操作ボタン（上部プラス/在庫に追加/モーダル×）をスクロール追従で固定する
status: implementation_ready
goal: スクロールで主要ボタンが画面外へ消えて押せなくなる問題を解消し、常に操作できるようにする。
acceptance:
  - 食材管理で在庫リストを下までスクロールしても「＋」追加ボタンが常に画面内に見えて押せる。
  - 手動追加モーダルでフォームをスクロールしても「在庫に追加」ボタンがモーダル下部に固定で見えて押せる。
  - どのモーダル（recipe-editor/inventory-editor/add-choice/photo-scan 等）でも本文をスクロールすると「×」ボタンがモーダルエリア右上に残り、いつでも閉じられる。
  - sticky 化で新たな横はみ出し・要素重なりが発生しない（TKT-0184 を後退させない）。
  - PC幅（>=720px）でも各ボタンが従来どおり機能し、見た目が破綻しない。
  - Web版 verify（lint/typecheck/build）が通る。
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/inventory-board.tsx
  - project-os/artifacts/TKT-0186-mobile-sticky-action-buttons/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0186-mobile-sticky-action-buttons
related_artifacts:
  - artifacts/TKT-0186-mobile-sticky-action-buttons/verify.json
  - artifacts/TKT-0186-mobile-sticky-action-buttons/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（CSS + 必要ならモーダル構造のJSX微調整）。`required_evals` は `pwa_mobile_ui`。スキーマ/Auth/RLS/Storage/AI/CSV に触れない。
  - verify は `/verify TKT-0186-mobile-sticky-action-buttons`。
  - 各ボタンの onClick・保存処理・モーダル開閉state は変更しない（配置のみ）。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。APIキー直書き禁止。
---

# Summary

スクロールで「＋」「在庫に追加」「×」が画面外へ消えて押せなくなる問題を解消する。要望は「sticky追従で
常時表示」。3ボタンをそれぞれ sticky 化する。特に「×」は `.canvas-modal`（`overflow:auto`）内で
`position:absolute` のため本文と一緒に流れるのを、sticky 化またはモーダルの固定ヘッダー化で右上に残す。

## 実装メモ（前提なしで着手できるよう詳述）

参照: `project-os/specs/SPEC-0186-mobile-sticky-action-buttons.md`。前提として TKT-0184 のはみ出し対策が入っている想定（sticky で後退させないこと）。

### 1. 上部「＋」追加ボタン（食材管理ヘッダー）
- 箇所: `web/src/components/inventory-board.tsx`（≈line 975-992）。`<section className="inventory-workspace">` 内の `.inventory-canvas-header` > `.canvas-mode-control.inventory-view-control` > `.primary-button.compact-button.icon-action`（`onClick={openAddChoice}`）。
- CSS: `web/src/app/globals.css`（`.inventory-canvas-header` ≈564 / スマホ ≈5847、`.canvas-mode-control` ≈1379、`.icon-action` ≈1398）。
- 方針: スマホでヘッダー（または＋ボタンを含むコントロール）を `position: sticky; top: <status-bar高さ>` にして、リストスクロール時も上部に残す。固定ヘッダー `.canvas-status-bar`（≈71, `position:fixed; min-height:32px`）の下に潜らないよう `top` と `z-index` を調整。背景を付けてリストと重なっても視認できるようにする。

### 2. 手動追加モーダルの「在庫に追加」ボタン
- 箇所: inventory-board.tsx の手動追加フォーム（≈line 1039-1221）、`<form className="stock-form">` 末尾の `.form-actions > .primary-button.submit-large`（`{editing ? "内容を更新する" : "在庫に追加"}`）。
- CSS: `.submit-large`（globals.css ≈1632）、`.form-actions`（≈2055付近）、モーダル本体 `.canvas-modal`（≈1558 `overflow:auto`）/ `.inventory-editor-modal`（≈1575）。
- 方針: `.form-actions` をモーダル下部に `position: sticky; bottom: 0` で固定し、背景＋上境界線を付けて本文と重なっても見えるようにする。モーダルが `overflow:auto` でスクロールする前提なので、フォーム末尾の sticky で「下部固定」になる。

### 3. 全モーダル共通「×」閉じるボタン
- CSS: `.modal-close-button`（globals.css ≈1647 `position:absolute; top:14px; right:14px`）が `.canvas-modal`（≈1558 `position:relative; overflow:auto`）内にあり、本文スクロールで一緒に流れて消える。
- 方針（いずれか）:
  - (a) `.modal-close-button` を `position: sticky; top: <padding>` にし、行内で右寄せ（`justify-self/align-self` やラッパー）してスクロール中も右上に残す、または
  - (b) モーダルを「固定ヘッダー（×を含む、スクロールしない）＋本文スクロール領域」の2段構造へ変更（`.canvas-modal` を grid: header / scroll-body にし、`overflow:auto` を本文側に移す）。この場合 inventory-board.tsx 等のモーダルJSXのラップ調整が必要。
  - 全モーダル（`.canvas-modal` 系: recipe-editor/inventory-editor/add-choice/photo-scan 等）で効くこと。既存の個別上書き（`.recipe-editor-modal .modal-close-button` ≈6705 / `.inventory-editor-modal .modal-close-button` ≈7291 / `.photo-scan-modal ... .modal-close-button` ≈5956）と整合させる。
- `z-index` を本文より上にして、本文要素の上に重なっても押せるようにする。

### 共通の注意
- sticky に背景・z-index を付けるとき、新たな横はみ出しを作らない（TKT-0184 を後退させない）。
- PC幅でも破綻しないこと。スマホ専用にするか全幅共通にするかは実装時に判断し report に記録する（＋とモーダル×は全幅共通で問題なくなる可能性が高い。在庫に追加の下部固定はスマホ限定でもよい）。

## 検証メモ

- `/verify TKT-0186-mobile-sticky-action-buttons`。
- 目視（report に記録）: スマホ幅で (1) 在庫リスト最下部までスクロール→＋が見える、(2) 手動追加モーダルを最下部までスクロール→在庫に追加が見える、(3) 各モーダル本文をスクロール→×が右上に残る。PC幅で各ボタンが従来どおり機能。

## 非ゴール

- 横はみ出し全般（→ TKT-0184）／食材名重なり（→ TKT-0185）。
- ボタンの動作・保存ロジック・モーダル開閉stateの変更。
- ボトムナビ `.bottom-mode-nav`（既に fixed）の変更。

## 依存チケット

- TKT-0184（スマホ横はみ出しの一掃）の後に実施。sticky で TKT-0184 のはみ出し対策を後退させないよう整合させる。

## 残リスク

- sticky ヘッダー／フッターが画面の縦スペースを食う。スマホで本文表示領域が狭くなりすぎないよう高さを最小限にする。
- モーダルを2段構造（方針3-b）にする場合、複数モーダルのJSX調整が必要で影響範囲がやや広がる。まず sticky（3-a）で足りるか試す。
