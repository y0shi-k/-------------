---
id: TKT-0221-all-buttons-tooltips
title: アプリ内の全ボタンにヘルプツールチップを付ける（もれなく）
status: completed
goal: ボタンの用途が見ただけでは分からず操作に迷う問題を防ぎ、全ボタンに自然に表示されるヘルプを与える。
acceptance:
  - 汎用ツールチップの仕組み（CSSクラス + `data-tooltip` 属性）を1つ定義し、既存の `.recipe-genre-more` 専用実装を汎用化する
  - Web版の主要コンポーネント（recipe-meal-workspace / inventory-board / cooking-history-board / cooking-record-edit-modal / recipe-filter-controls / web-mode-shell / unit-picker / その他モーダル類）の全ボタンに、用途を説明する `data-tooltip` 文言が付く（アイコンのみボタンを含めて漏れがない）
  - ツールチップは hover とキーボードフォーカス（:focus-visible）の両方で表示され、マウスなしでも確認できる
  - ツールチップが画面端で見切れない/他要素に不自然に被らないよう配置が調整されている
  - 既存の `aria-label` と矛盾しない文言にする（アイコンボタンのアクセシビリティを損なわない）
  - ツールチップ追加によって既存のクリック動作・レイアウト・横スクロール有無が変わらない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/
  - project-os/artifacts/TKT-0221-all-buttons-tooltips/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0064-dynamic-genre-summary-tooltip
related_artifacts:
  - artifacts/TKT-0221-all-buttons-tooltips/verify.json
  - artifacts/TKT-0221-all-buttons-tooltips/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0221`。コマンドの正本は `harness/registry.json`
  - 非危険変更（属性付与とCSSのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
  - 規模が大きい（ボタン約190箇所）。`/verify` 前にコンポーネント単位でボタン網羅チェックを行い、付け漏らしを防ぐこと
---

# Summary

Web版にはボタンが約190箇所あるが、用途を示すツールチップは `.recipe-genre-more`（`globals.css` 4741-4767 行、`data-tooltip` + `::after` 疑似要素）のみ。これを汎用クラス化し、全ボタンに `data-tooltip` でヘルプを付ける。多くのアイコンボタンには既に `aria-label`（79箇所）があり、文言の下地に流用できる。UIライブラリ（shadcn/radix）は未導入のため、CSS only の自前ツールチップで実装する。

## 参照すべき既存実装

- `web/src/app/globals.css` 4741-4767 行: `.recipe-genre-more[data-tooltip]::after` の既存ツールチップ（背景 `#0f172a`、白文字、`:hover`/`:focus-visible` で表示）。これを汎用クラス（例 `.has-tooltip` / 属性セレクタ `[data-tooltip]`）へ一般化する。
- ボタンスタイルクラス: `.primary-button` / `.secondary-button` / `.danger-button` / `.compact-button` / `.icon-action`（`globals.css`）。
- ボタン集中ファイル（おおよその数）:
  - `web/src/components/recipe-meal-workspace.tsx`（約93）
  - `web/src/components/inventory-board.tsx`（約39）
  - `web/src/components/cooking-history-board.tsx`（約15）
  - `web/src/components/cooking-record-edit-modal.tsx`（約10）
  - `web/src/components/recipe-filter-controls.tsx`（約7）/ `web/src/components/web-mode-shell.tsx`（約6）/ `web/src/components/unit-picker.tsx`（約5）
  - その他（delete-confirm / fraction-picker / gemini-api-key 等、約20）
- 既存 `aria-label` 付きボタン（79箇所）は文言再利用の出発点にする。

## 実装メモ

- `globals.css` に汎用ツールチップを定義する。`[data-tooltip]` を持つ要素に `position: relative` を確保し、`::after`（本文）と必要なら `::before`（吹き出しの三角）を `:hover, :focus-visible` で表示。`z-index` を既存モーダル/オーバーレイより前面に、ただしステータスバー等と競合しない値にする。
- 画面端での見切れ対策: 端のボタンには配置調整（例: `data-tooltip-pos="left"` 等のバリアントを用意）。最低限、横スクロールを誘発しないこと。
- 各 `.tsx` のボタンに `data-tooltip="…"` を付与する。文言は短く用途が分かる日本語（例: 「このレシピを編集」「献立に追加」「1日後へ移動」）。既存 `aria-label` がある場合はそれと整合させる（重複読み上げを避けたい場合は `aria-label` を主、`data-tooltip` を視覚補助とする方針を統一）。
- 付け漏らし防止: ファイルごとに `<button` を grep で洗い出し、全件に `data-tooltip` が付いたかをチェックする。アイコンのみボタン（テキストなし）は特に優先。
- 文言・スタイルは既存トーンに合わせ、過度な装飾をしない。イミュータブル方針・命名規約を守る。

## 非ゴール

- 共通 `<Button>` コンポーネントの新規導入やボタンの全面リファクタ（今回は属性付与にとどめる）。
- radix-ui / shadcn 等の外部ツールチップライブラリの追加。
- ボタン以外の要素（入力欄・リンク等）へのツールチップ展開（ボタンに限定。必要なら別チケット）。
- ツールチップ文言の多言語化。
