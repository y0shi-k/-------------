---
id: TKT-0226-shopping-shortage-modal-wide
title: 「買い物に追加するもの」モーダルのPCワイドレイアウト化
status: completed
goal: 512px 固定で細長い不足材料選択モーダルを PC 幅を活かしたレイアウトにし、候補の確認・選択をしやすくする。
acceptance:
  - "PC幅（@media min-width: 1024px 目安）で `.shopping-shortage-modal` の幅が `min(880px, 94vw)` 程度に広がる（現状 `min(512px, 100%)`）"
  - PC幅で候補リスト（`.shopping-shortage-list`）が2〜3カラムのグリッドになり、縦一列の細長表示が解消される（チェックボックス＋名前＋不足量＋分類バッジの行構成は維持）
  - タブ（ALL/食材/調味料）・「表示中をすべて選択」・下部アクション（あとで/選択したものを追加）の配置・操作性が維持される
  - "`.canvas-modal` 共通トーン（角丸・余白・h3 見出し・閉じるボタン）を踏襲し、横スクロール・はみ出しが出ない"
  - スマホ幅（375px）では従来の1カラム表示が維持され崩れない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/recipe-meal-workspace.tsx
  - project-os/artifacts/TKT-0226-shopping-shortage-modal-wide/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0225-consumption-shopping-modal-wide
related_artifacts:
  - artifacts/TKT-0226-shopping-shortage-modal-wide/verify.json
  - artifacts/TKT-0226-shopping-shortage-modal-wide/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0226`。コマンドの正本は `harness/registry.json`
  - 非危険変更（CSS＋必要最小限のマークアップのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - TKT-0224 と同ファイル（recipe-meal-workspace.tsx）を触るため、コンフリクト回避で TKT-0224 完了後の実施を推奨
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

「買い物に追加するもの」モーダルは `.shopping-shortage-modal { width: min(512px, 100%); height: calc(100vh - 96px); }`
（`globals.css` 8313行付近）で、PC では細長い縦長カラムになる。PC 幅でモーダルを広げ、
候補リストを複数カラム化する。スマホは現状維持。

## 参照すべき既存実装

- `web/src/app/globals.css:8307-8360` `.shortage-select-backdrop` / `.shopping-shortage-modal` /
  `.shopping-shortage-meta` / `.shopping-shortage-tabs`。`.shopping-shortage-list` /
  `.shopping-shortage-option` / `.shopping-shortage-actions` も同セクションにある
  （`shopping-shortage` で検索）。このモーダルは `.canvas-modal` 派生だが
  `display: flex; flex-direction: column; gap: 0; overflow: hidden;` の独自構成。
- `web/src/components/recipe-meal-workspace.tsx:3087-3137`: モーダルのマークアップ
  （タブ・全選択・候補リスト・アクション）。
- 消費量調整側の同種対応: TKT-0225（メディアクエリ・カラム化のパターンを揃える）。
- PC レイアウトの正本: `docs/design/pc-design-language.md`。

## 実装メモ

- 基本は CSS のみ: `@media (min-width: 1024px)` で
  `.shopping-shortage-modal { width: min(880px, 94vw); }`、
  `.shopping-shortage-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }`
  （候補数が多い場合は 3 カラムも検討。`repeat(auto-fill, minmax(240px, 1fr))` 方式でもよい）。
- 現状の `height: calc(100vh - 96px); max-height: 720px;` は固定高のため、ワイド化後に
  中身が少ないとき間延びしないか確認し、必要なら PC では `height: auto` ＋ `max-height` に調整する。
- `.shopping-shortage-option` の行内（checkbox / 名前+不足量 / 分類バッジ）の配置はカラム内で完結させ、
  長い食材名の折返し・はみ出しに注意（`minmax(0, 1fr)`）。
- TKT-0225 とメディアクエリのブレークポイント・幅の取り方（94vw 等）を揃え、トーンを統一する。
- APIキー直書き禁止。GAS/Spreadsheet/Drive 不使用。

## 非ゴール

- 不足計算・マッチングロジック（TKT-0224）。
- 消費量調整モーダルのワイド化（TKT-0225）。
- 買い物リスト本体画面・`shopping_items` の変更。
- スマホレイアウトの変更。

## 依存チケット

- ハード依存なし。同ファイルを触る TKT-0224 の完了後に実施推奨。TKT-0225 とパターンを揃えるため同時期実施が望ましい。
