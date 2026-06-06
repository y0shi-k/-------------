---
id: TKT-0184-mobile-horizontal-overflow-fix
title: スマホ幅で全画面の横はみ出し（horizontal overflow）を一掃する【土台】
status: completed
goal: スマホでアプリが横にはみ出して崩れる問題を解消し、以降のスマホUI調整（TKT-0185/0186）の土台を作る。
acceptance:
  - iPhone幅（375px）相当で主要画面（ホーム/食材管理/料理履歴/献立/各モーダル）が横スクロールを起こさない（document幅 <= viewport幅）。
  - `.consumption-row-controls` の `min-width:220px`/固定 flex-basis がスマホで緩和され、消費完了系コントロールが折返して収まる。
  - `.cooking-filter-row` がスマホで5列ではなく収まる列数（2列等）になる。
  - `.conversion-row` の固定列がスマホで収まる（折返し or 列緩和）。
  - `.cooking-summary-grid`/`.insight-grid`/`.home-feature-grid` がスマホで横はみ出ししない列数になる。
  - PC幅（>=720px）の見た目が従来と変わらない。
  - Web版 verify（lint/typecheck/build）が通る。
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0184-mobile-horizontal-overflow-fix/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0184-mobile-horizontal-overflow-fix
related_artifacts:
  - artifacts/TKT-0184-mobile-horizontal-overflow-fix/verify.json
  - artifacts/TKT-0184-mobile-horizontal-overflow-fix/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（CSSのみ）。`required_evals` は `pwa_mobile_ui`。スキーマ/Auth/RLS/Storage/AI/CSV に触れない。
  - verify は `/verify TKT-0184-mobile-horizontal-overflow-fix`（= `harness/bin/verify_web.sh`）。
  - Tailwind不使用。スタイルは `web/src/app/globals.css` に集約。主ブレークポイントは `@media (max-width: 719px)`（既存 `min-width: 720px` 境界に合わせる）。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。APIキー直書き禁止。
---

# Summary

スマホ幅でアプリ全体が横にはみ出す崩れを解消する土台チケット。globals.css の固定幅(px)・固定グリッド列に
スマホ用 `@media (max-width: 719px)` を当て、列数・最小幅を緩和する。保険として `body`/`.app-shell` の
`overflow-x` ガードも検討する。PC幅は変えない。

## 実装メモ（前提なしで着手できるよう詳述）

参照: `project-os/specs/SPEC-0184-mobile-horizontal-overflow-fix.md`。

調査で特定済みの横はみ出し原因（`web/src/app/globals.css`、行は調査時点の目安。実装時に grep で再確認すること）:

1. `.consumption-row-controls`（≈4559）: `flex: 1 1 260px; min-width: 220px; justify-content: flex-end;`
   - スマホで `min-width` を 0 付近へ緩和し、`flex-wrap`/`flex-basis` を見直して折返し可にする。使用箇所は `web/src/components/recipe-meal-workspace.tsx`（≈2934）の消費量フィールド行。
2. `.cooking-filter-row`（≈871）: `grid-template-columns: repeat(5, minmax(0,1fr));`
   - スマホで `repeat(2, minmax(0,1fr))` 等に。使用箇所 `web/src/components/cooking-history-board.tsx`（≈223）。
3. `.conversion-row`（≈2026）: `grid-template-columns: minmax(72px,auto) auto minmax(96px,1fr) minmax(120px,1fr);`
   - スマホで列を緩める/折返し。モーダル内 `.inventory-editor-modal .conversion-row`（≈5468）は既に緩和済みなので、モーダル外の素の `.conversion-row` をスマホ調整する。
4. グリッド類: `.cooking-summary-grid`（4列）/`.insight-grid`（2列）/`.home-feature-grid`（2列）にスマホ用列数（1〜2列）を追加。
5. 保険: `body` または `.app-shell`（≈65）に `overflow-x: hidden`（または `clip`）を検討。ただし**意図的な横スクロール**（`.location-tab-row` ≈1446 / `.canvas-sort-row` ≈1498 の `overflow-x:auto`）と sticky を壊さないこと。

実装の進め方:
- まず DevTools の 375px 幅で各画面を開き、横スクロールが出る箇所を実測で確定（上記は当たり。実態優先）。
- スマホ用メディアクエリ（`@media (max-width: 719px)`）で列数・最小幅を緩和。既存のスマホ用ブロックがあれば追記、無ければ追加。
- PC幅（>=720px）のルールには触れない（後退させない）。

## 検証メモ

- `/verify TKT-0184-mobile-horizontal-overflow-fix`。
- 目視（report に記録）: 375px 幅で各画面 `document.documentElement.scrollWidth <= window.innerWidth` を満たす。PC幅で従来と差異なし。

## 非ゴール

- 食材名行の文字重なり修正（→ TKT-0185）。
- ボタンの sticky 固定（→ TKT-0186）。
- PC幅レイアウトの変更、デザイン刷新。

## 依存チケット

- なし（最初に着手する土台）。TKT-0185 / TKT-0186 はこのチケットの後に実施する。

## 残リスク

- `overflow-x: hidden` を広く当てると sticky や意図的横スクロールを潰す恐れ。適用範囲を絞り、当てた場合は report に範囲を明記する。
