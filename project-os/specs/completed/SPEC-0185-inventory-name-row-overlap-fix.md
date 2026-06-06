---
id: SPEC-0185-inventory-name-row-overlap-fix
title: 食材管理の食材名行でスマホ時に文字が重なる崩れを直す
status: draft
scope:
  - 食材管理（在庫一覧）の在庫カード `.stock-item` のスマホ表示
  - 食材名 `.item-main h4` とバッジ（期限チップ `.expiry-chip` / 換算チップ `.conversion-chip`）の重なり
constraints:
  - 触らない範囲: PC幅（>=720px）の在庫カードレイアウト、在庫の編集/削除/数量増減のロジック
  - 横はみ出し全般（→ SPEC-0184）と sticky 固定（→ SPEC-0186）は対象外
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS のロジックは変更しない（表示のみ）
acceptance:
  - スマホ幅（375px）で在庫カードの食材名とバッジ（期限・換算）が重ならず、両方が読める。
  - 食材名が長い場合も崩れず、省略（ellipsis）または適切な折返しで収まる。
  - 数量ステッパー・編集/削除ボタンなど他要素と重ならない。
  - PC幅（>=720px）の見た目が従来と変わらない。
  - Web版 verify（lint/typecheck/build）が通る。
related_tickets:
  - TKT-0185-inventory-name-row-overlap-fix
---

# Summary

スマホで在庫カードの食材名行の文字が重なる崩れを解消する。原因はスマホで `.item-main h4` が
`white-space: normal` になり、`.item-title-row`（`flex-wrap: wrap`）内で名前が折返し・拡大して
バッジと重なること。スマホグリッド/flex の調整で重なりを解消する。

## 背景

ユーザーが最も困っている崩れの一つ。食材管理で食材名の行の文字が重なって読めない。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`
- 対象コンポーネント: `web/src/components/inventory-board.tsx`（在庫カード ≈line 1461-1510）
- 対象CSS: `web/src/app/globals.css`
  - `.stock-item` デスクトップ（≈5164）/ スマホ（≈5881 `grid-template-columns: 44px minmax(0,1fr) auto` + grid-template-areas）
  - `.item-title-row`（≈5194 flex / ≈5917 スマホで `flex-wrap: wrap`）
  - `.item-main h4`（≈5201 デスクは ellipsis+nowrap / ≈5921 スマホで `white-space: normal`）
  - チップ `.expiry-chip` / `.conversion-chip`（≈5225-5253 `flex: 0 0 auto`）
- 方針: スマホで名前の折返し/拡大とチップ配置が衝突しないよう、名前の表示（ellipsis維持 or 折返し時のmin-width確保）とチップの配置（別行/縮小）を整える。必要なら inventory-board.tsx のマークアップを微調整。
- verify: `/verify`

## 非対象

- 横はみ出し全般（→ SPEC-0184）
- ボタンの sticky 固定（→ SPEC-0186）
- 在庫の編集/削除/数量ロジックの変更

## Acceptance Example

- スマホ幅で食材名の長い在庫（例: 20文字超）とチップ付き在庫を表示し、文字が重ならないことを目視確認し report に記録する。
- PC幅で従来と差異がないことを確認する。
