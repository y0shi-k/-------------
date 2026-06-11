---
id: TKT-0225-consumption-modal-wide
title: 「実際の消費量を調整」モーダルのPCワイドレイアウト化
status: completed
goal: PC で細長く表示され材料行が縦に長く積まれて見にくい消費量調整モーダルを、PC 幅を活かしたレイアウトにして確認・修正の手間を減らす。
acceptance:
  - "PC幅（@media min-width: 1024px 目安）で `.consumption-modal` の幅が `min(960px, 94vw)` 程度に広がる（現状 `min(640px, 100%)`）"
  - PC幅で材料行リスト（`.consumption-list`）が2カラムのグリッドになり、縦一列の細長表示が解消される（行内の「在庫プルダウン＋数量入力」の操作性は維持）
  - 調理完了時モーダル（`recipe-meal-workspace.tsx` の `consumption-modal`）と履歴編集モーダル（`cooking-record-edit-modal.tsx`）の両方に同じレイアウトが効く
  - "`.canvas-modal` 共通トーン（角丸・padding 28px・h3 見出し・sticky 閉じるボタン・form-actions の sticky）を踏襲し、横スクロール・はみ出しが出ない"
  - スマホ幅（375px）では従来の1カラム表示が維持され崩れない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - project-os/artifacts/TKT-0225-consumption-modal-wide/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0225-consumption-shopping-modal-wide
related_artifacts:
  - artifacts/TKT-0225-consumption-modal-wide/verify.json
  - artifacts/TKT-0225-consumption-modal-wide/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0225`。コマンドの正本は `harness/registry.json`
  - 非危険変更（CSS＋必要最小限のマークアップのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - TKT-0223 と同ファイル（recipe-meal-workspace.tsx / cooking-record-edit-modal.tsx）を触るため、コンフリクト回避で TKT-0223 完了後の実施を推奨
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

消費量調整モーダルは `.consumption-modal { width: min(640px, 100%) }`（`globals.css` 3882行付近）で、
PC では細長い。材料行（材料名＋在庫プルダウン＋数量）が縦に積まれ、材料が多いレシピではスクロールが長い。
PC 幅でモーダルを広げ、材料行を2カラム化する。スマホは現状維持。

## 参照すべき既存実装

- `web/src/app/globals.css:1785-1796` `.canvas-modal`（ベース: grid・gap 14px・角丸8px・padding 28px）、
  `:1874-1897` `.modal-close-button`（sticky）、`:2301` `.canvas-modal .form-actions`（sticky 下部）。
- `web/src/app/globals.css:3875-3902` `.consumption-backdrop` / `.consumption-modal` /
  `.consumption-modal-actions`。`.consumption-list` / `.consumption-row` / `.consumption-row-top` /
  `.consumption-row-controls` も globals.css 内にある（`consumption-` で検索）。
- `web/src/components/recipe-meal-workspace.tsx:2749-2770`: 調理完了時の
  `<section className="canvas-modal consumption-modal">` と `ConsumptionEditor`（3847-3993行）。
- `web/src/components/cooking-record-edit-modal.tsx:331-343`:
  `<section className="canvas-modal consumption-modal cooking-record-edit-modal">`。
  こちらは消費リストの下に料理記録パネル（写真・評価・コメント）も持つ。
- PC レイアウトの正本: `docs/design/pc-design-language.md`。
- メディアクエリの前例: `globals.css:7090` 付近の `.canvas-modal` 向け `@media`。

## 実装メモ

- 基本は CSS のみで実現する: `@media (min-width: 1024px)` で
  `.consumption-modal { width: min(960px, 94vw); }`、
  `.consumption-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }` 等。
  マークアップ変更は class 付与など最小限に留める。
- `.consumption-row` 内は折返し・省略（材料名が長い場合）に注意。`minmax(0, 1fr)` で
  グリッドアイテムのはみ出しを防ぐ。
- 在庫不足警告（`.consumption-shortage` / `.consumption-item-warning`）はカラム内で完結させる。
- `cooking-record-edit-modal` の料理記録パネル（写真リスト等）は2カラム化の対象外
  （消費リスト部分のみ2カラム）。
- 既存テスト（`cooking-record-edit-modal.test.tsx` / `recipe-meal-workspace.test.tsx`）は
  DOM 構造に依存している可能性があるため、マークアップを変えた場合は期待値を確認する。
- APIキー直書き禁止。GAS/Spreadsheet/Drive 不使用。

## 非ゴール

- マッチング・自動紐付けロジック（TKT-0223）。
- 買い物追加モーダルのワイド化（TKT-0226）。
- 他モーダル（レシピ編集・在庫編集等）の幅変更。
- スマホレイアウトの変更。

## 依存チケット

- ハード依存なし。同ファイルを触る TKT-0223 の完了後に実施推奨。
