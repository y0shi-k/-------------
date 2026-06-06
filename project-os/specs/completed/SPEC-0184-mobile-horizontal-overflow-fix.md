---
id: SPEC-0184-mobile-horizontal-overflow-fix
title: スマホ幅で全画面の横はみ出し（horizontal overflow）を解消する
status: draft
scope:
  - Web版の全画面のスマホ表示（主ブレークポイント @media (max-width: 719px)）
  - 横はみ出しを起こしている固定幅・固定列のCSS（globals.css）
constraints:
  - 触らない範囲: PC幅（>=720px）の既存レイアウト・デザイン正本を変えない
  - 食材名行の文字重なり（→ SPEC-0185）と sticky 固定（→ SPEC-0186）はこの spec の対象外
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS は扱わない（CSS中心の表示変更）
acceptance:
  - iPhone幅（375px）相当のビューポートで、各主要画面（ホーム/食材管理/料理履歴/献立/各モーダル）が横スクロール（document幅 > viewport幅）を起こさない。
  - 既知の固定値が解消されている: `.consumption-row-controls` の `min-width:220px`/固定 flex-basis、`.cooking-filter-row` の5列、`.conversion-row` の固定列、`.cooking-summary-grid`/`.insight-grid`/`.home-feature-grid` のスマホ列数。
  - PC幅（>=720px）の見た目が従来と変わらない。
  - Web版 verify（lint/typecheck/build）が通る。
related_tickets:
  - TKT-0184-mobile-horizontal-overflow-fix
---

# Summary

スマホ幅でアプリ全体が横にはみ出す問題を解消する。原因は globals.css 内の固定幅（px）・固定グリッド列が
スマホ用ブレークポイントを持たないこと。スマホ用 `@media (max-width: 719px)` で列数・最小幅を緩和し、
保険として `body`/`.app-shell` に `overflow-x` ガードを置く。

## 背景

PC中心に編集してきたためスマホ未調整で、テスト時にレイアウトが崩れる。調査で複数の横はみ出し原因を特定済み（下記 仕様参照）。Tailwind不使用でスタイルは `web/src/app/globals.css` に集約されている。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`
- Canvas版 `app.html` は凍結・参照専用（編集しない）
- 主ブレークポイント: `@media (max-width: 719px)`（既存 `min-width: 720px` の境界に合わせる）
- 既知の横はみ出し原因（globals.css、行は調査時点の目安）:
  - `.consumption-row-controls`（≈4559）: `flex: 1 1 260px; min-width: 220px;` → スマホで最小幅を緩和し折返し可に
  - `.cooking-filter-row`（≈871）: `repeat(5, minmax(0,1fr))` → スマホで2列等へ
  - `.conversion-row`（≈2026）: 固定列 → スマホで列を緩める/折返し
  - `.cooking-summary-grid`（4列）/`.insight-grid`（2列）/`.home-feature-grid`（2列）: スマホ用列数を追加
  - 保険: `body`/`.app-shell` に `overflow-x: hidden`（または `clip`）を検討。ただし sticky/横スクロール意図箇所（`.location-tab-row`, `.canvas-sort-row` の `overflow-x:auto`）を壊さないこと
- verify: `/verify`（= `harness/bin/verify_web.sh`）

## 非対象

- 食材名行の文字重なり修正（→ SPEC-0185 / TKT-0185）
- ボタンの sticky 固定（→ SPEC-0186 / TKT-0186）
- PC幅レイアウトの変更

## Acceptance Example

- DevTools の 375px 幅で各画面を開き、`document.documentElement.scrollWidth <= window.innerWidth` を満たす（横スクロールが出ない）。判定結果は report に記録する。
- PC幅で既存スクショと差異がないことを目視確認し report に記録する。
