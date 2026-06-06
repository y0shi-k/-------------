---
id: TKT-0185-inventory-name-row-overlap-fix
title: 食材管理の食材名行でスマホ時に文字が重なる崩れを直す
status: completed
goal: スマホの在庫カードで食材名とバッジ（期限・換算チップ）が重なって読めない崩れを解消する。
acceptance:
  - スマホ幅（375px）で在庫カードの食材名とバッジ（期限・換算）が重ならず、両方が読める。
  - 食材名が長い場合（20文字超など）も崩れず、省略（ellipsis）または適切な折返しで収まる。
  - 数量ステッパー・編集/削除ボタンなど他要素と重ならない。
  - PC幅（>=720px）の在庫カードの見た目が従来と変わらない。
  - Web版 verify（lint/typecheck/build）が通る。
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/inventory-board.tsx
  - project-os/artifacts/TKT-0185-inventory-name-row-overlap-fix/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0185-inventory-name-row-overlap-fix
related_artifacts:
  - artifacts/TKT-0185-inventory-name-row-overlap-fix/verify.json
  - artifacts/TKT-0185-inventory-name-row-overlap-fix/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（CSS + JSXの表示のみ）。`required_evals` は `pwa_mobile_ui`。スキーマ/Auth/RLS/Storage/AI/CSV に触れない。
  - verify は `/verify TKT-0185-inventory-name-row-overlap-fix`。
  - 在庫の編集/削除/数量増減のロジックは変更しない（表示のみ）。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。APIキー直書き禁止。
---

# Summary

スマホで在庫カードの食材名行の文字が重なる崩れを直す。原因はスマホで `.item-main h4` が
`white-space: normal` になり、`.item-title-row`（`flex-wrap: wrap`）内で名前が折返し・拡大して
期限/換算チップと重なること。スマホグリッド/flex の配置を整えて重なりを解消する。

## 実装メモ（前提なしで着手できるよう詳述）

参照: `project-os/specs/SPEC-0185-inventory-name-row-overlap-fix.md`。前提として TKT-0184 のはみ出し対策が入っている想定（整合させる）。

対象マークアップ: `web/src/components/inventory-board.tsx` の在庫カード（≈line 1461-1510）
```
<article className="stock-item">
  <IngredientIcon ... />
  <label className="select-row"> ... </label>
  <div className="item-main">
    <div className="item-title-row">
      <h4>{item.name}</h4>
      {expiryBadge ? <span className="expiry-chip">...</span> : null}
      {item.unit_conversion ? <span className="conversion-chip">...</span> : null}
    </div>
    <p>{item.storage_location} · 購入 ...</p>
  </div>
  {status_note ? <p className="item-note">...</p> : null}
  {quantity-stepper}
  <div className="item-actions"> 編集 / 削除 </div>
</article>
```

対象CSS: `web/src/app/globals.css`（行は調査時点の目安。実装時に grep で再確認）
- `.stock-item` デスクトップ（≈5164 `grid-template-columns: auto minmax(0,1fr) auto auto auto`）/ スマホ（≈5881 `grid-template-columns: 44px minmax(0,1fr) auto` + `grid-template-areas`）
- `.item-main`（≈5190 `min-width:0`）
- `.item-title-row`（≈5194 `display:flex; min-width:0; gap:7px` / スマホ ≈5917 `flex-wrap: wrap`）
- `.item-main h4`（≈5201 デスク `text-overflow:ellipsis; white-space:nowrap` / スマホ ≈5921 `white-space: normal`）
- `.expiry-chip` / `.conversion-chip`（≈5225-5253 `flex: 0 0 auto`）

方針（いずれか/組合せ。実態を見て選ぶ）:
- 食材名 `h4` をスマホでも ellipsis（`min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`）に保ち、チップを名前の右で縮まないようにする、または
- 名前を折返し可にするなら、チップを `.item-title-row` の外（別行）に出すか、`flex-wrap` 時にチップが名前の上に重ならないよう行間/配置を確保する。
- スマホグリッドの列・areas が名前領域を潰していないか確認し、名前列に十分な幅（`minmax(0,1fr)`）を割り当てる。

実装の進め方:
- DevTools 375px で、長い名前＋チップ付きの在庫を表示して重なりを再現 → 上記方針で解消 → 数量ステッパー/編集/削除と干渉しないか確認。
- PC幅のルールは変えない。

## 検証メモ

- `/verify TKT-0185-inventory-name-row-overlap-fix`。
- 目視（report に記録）: 375px で長い食材名＋チップが重ならず読める。数量/編集/削除と非干渉。PC幅で従来と差異なし。

## 非ゴール

- 横はみ出し全般（→ TKT-0184）。
- ボタンの sticky 固定（→ TKT-0186）。
- 在庫の編集/削除/数量ロジックの変更、在庫カードのデザイン刷新。

## 依存チケット

- TKT-0184（スマホ横はみ出しの一掃）の後に実施。同じスマホ用CSSブロックを編集するため、TKT-0184 の調整と整合させる。

## 残リスク

- ellipsis にすると長い食材名の末尾が見えなくなる。タップ/編集で全文確認できるため当面許容。気になる場合は将来チケットで対応。
