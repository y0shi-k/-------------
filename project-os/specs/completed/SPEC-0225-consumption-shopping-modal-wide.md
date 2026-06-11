---
id: SPEC-0225-consumption-shopping-modal-wide
title: 消費量調整・買い物追加モーダルのPCワイドレイアウト
status: draft
scope:
  - 消費量調整モーダル（調理完了時 `consumption-modal` / 履歴編集 `cooking-record-edit-modal`）
  - 「買い物に追加するもの」モーダル（`shopping-shortage-modal`）
constraints:
  - CSS＋必要最小限のマークアップ変更のみ。ロジック・DB・Storage は触らない
  - スマホ幅（375px 基準）の既存表示を崩さない（PC幅のみ拡張）
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - PC幅（1024px 以上目安）で各モーダルが横幅を活かしたレイアウトになり、縦一列の細長表示が解消される
  - 既存モーダル共通トーン（`.canvas-modal` の角丸・余白・見出し・閉じるボタン）を踏襲する
  - スマホ幅では従来のレイアウトが維持される
related_tickets:
  - TKT-0225-consumption-modal-wide
  - TKT-0226-shopping-shortage-modal-wide
---

# Summary

消費量調整モーダルは `width: min(640px, 100%)`（`globals.css` `.consumption-modal`）、
買い物追加モーダルは `min(512px, 100%)`（`.shopping-shortage-modal`）で、PC では画面中央に
細長く表示され材料行が縦に長く積まれて見にくい。PC 幅では幅を広げ、行を複数カラム化する。

## 背景

- ベースモーダル: `.canvas-modal`（`globals.css` 1785行〜）= `width: min(560px, 100%)`、
  grid・gap 14px・角丸 8px・padding 28px・`.modal-close-button`（sticky 右上）。
- 派生幅の前例: `.recipe-editor-modal` 680px / `.consumption-modal` 640px / `.shopping-shortage-modal` 512px。
- PC デザインの正本: `docs/design/pc-design-language.md`（≥1024px はデスクトップ扱い）。

## 仕様

- **消費量調整モーダル**（2実装: `recipe-meal-workspace.tsx` の調理完了モーダル＋
  `cooking-record-edit-modal.tsx`）: PC 幅で `min(960px, 94vw)` 程度へ拡大。
  材料行リスト（`.consumption-list`）を PC では 2 カラムのグリッドにする等、横幅を活かす。
  ツールバー（タブ＋一括ボタン）・在庫不足警告の配置は崩さない。
- **買い物追加モーダル**: PC 幅で `min(880px, 94vw)` 程度へ拡大。
  候補リスト（`.shopping-shortage-list`）を PC では 2〜3 カラム化。タブ・全選択・アクション行は維持。
- いずれもメディアクエリ（`@media (min-width: 1024px)` 目安）で PC のみ適用し、スマホは現状維持。

## 非対象

- モーダル内の機能・ロジック変更（マッチングは SPEC-0222 側）。
- 他モーダル（レシピ編集・在庫編集等）の幅変更。

## Acceptance Example

- 1280px 幅で消費量調整モーダルを開くと材料行が2カラムで並び、横スクロール・はみ出しがない。
- 375px 幅で開くと従来どおり1カラムで崩れがない。
- `project-os/artifacts/TKT-0225〜0226/` の verify.json・report.md で達成可否を判定できる。
