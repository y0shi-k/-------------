---
id: SPEC-0155-recipe-editor-ingredient-row-layout
title: レシピ編集モーダルの材料行レイアウト改善（単位ピッカーの崩れ解消・TKT-0154 のコンセプト適用）
status: spec_ready
scope:
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 非危険変更（CSSのみ）。Supabase schema / Auth・RLS / 写真Storage / AI route / CSV移行は触らない
  - JSX/コンポーネントのロジック・DOM構造は変更しない（`recipe-meal-workspace.tsx` は据え置き）
  - `.genre-*` のベース定義（ジャンルタグピッカー・在庫モーダルの単位ピッカー共用）は変更しない。追加指定はすべて `.canvas-recipe-item-row` スコープに限定する
constraints_notes:
  - 単位ピッカー（`UnitPicker`）コンポーネント自体は TKT-0154 のものを流用し変更しない。レイアウト（列幅・nowrap）だけを調整する。
acceptance:
  - レシピ編集モーダルの材料/調味料行で、単位ピッカーが横一列で表示され、`{×, ×, +` のような縦積み崩れが発生しない
  - 品名・数量・単位・削除が1行（インライン）に収まり、数量・単位の入力に十分な幅がある
  - モーダル幅が在庫モーダル（720px）と統一され、見た目（数量・単位入力）が TKT-0154 と揃う
  - ブラウザ幅 520px 以下でも材料行が1行を維持し破綻しない
  - ジャンルタグピッカー・在庫モーダルの単位ピッカーの表示に副作用が無い
  - Web版verifyが通る
related_tickets:
  - TKT-0155-recipe-editor-ingredient-row-layout
---

# Summary

「レシピを編集」モーダルの材料/調味料行で、数量・単位入力が狭く使いにくい問題を、TKT-0154（在庫の数量・単位入力UX改善）と同じコンセプト（モーダル幅拡張 + 単位ピッカーに十分な幅 + nowrap 化）で解消する。レイアウトは1行インライン維持（ユーザー確定）。CSSのみで対応し、JSX は変更しない。

## 背景

- TKT-0154 で在庫・買い物・レシピ材料の単位入力をテキスト手入力から `UnitPicker`（タグ＋検索input＋クリア/追加アイコン2つを持つ `min-height: 52px` のポップオーバーフィールド）に置き換えた。
- 在庫モーダルでは `.qty-unit-wrap`（`globals.css` L5242-5280）で数量＋単位を `flex-wrap: nowrap` の十分な幅に並べているため崩れない。
- 一方レシピ材料行（`.canvas-recipe-item-row`）はグリッド `grid-template-columns: 20px minmax(0,1fr) 64px 64px 36px` のままで、`UnitPicker` が **64px幅の単位列**に押し込められる。`.genre-field { flex-wrap: wrap }` のため横に収まらず折り返し、スクリーンショットの `{×, ×, +` のような縦積み崩れになっていた。

## 仕様（`web/src/app/globals.css` のみ）

### A. モーダル幅の統一（`.recipe-editor-modal`）
- `width: min(672px, 100%)` → `width: min(720px, 100%)`（在庫モーダル `.inventory-editor-modal` と統一）。

### B. 材料行グリッドの列幅（`.canvas-recipe-item-row`）
- `grid-template-columns: 20px minmax(0, 1fr) 64px 64px 36px;`
  → `grid-template-columns: 20px minmax(0, 1fr) 5rem 10rem 36px;`
  （ハンドル / 品名=可変 / 数量=約5rem / 単位=約10rem / 削除=36px）

### C. 単位ピッカーの nowrap 化（`.canvas-recipe-item-row` スコープで追加）
`.qty-unit-wrap` の指定を踏襲し、単位列内のタグ・入力・アイコンを横一列に収める:
```css
.canvas-recipe-item-row .genre-field { flex-wrap: nowrap; min-height: 40px; padding: 4px 8px; }
.canvas-recipe-item-row .genre-tags { flex: 0 0 auto; flex-wrap: nowrap; }
.canvas-recipe-item-row .genre-input { min-width: 0; flex: 1 1 2rem; }
.canvas-recipe-item-row .genre-icon-button { width: 28px; height: 28px; }
```

### D. スマホ幅（`@media (max-width: 520px)`）
- 1行インラインを維持したまま列幅を調整:
  `grid-template-columns: 18px minmax(64px, 1fr) 3.5rem minmax(6rem, 0.9fr) 32px;`
- 既存の `.canvas-recipe-item-row .genre-input` の `min-width` は `0` にして狭幅でも溢れないようにする（アイコン24pxは既存のまま）。

## 残リスク
- 単位タグが極端に長い単位名（通常は「個」「大さじ」等で短い）の場合、10rem 列でタグ名が省略表示になる可能性（`.genre-tag-name` は `text-overflow: ellipsis` 済みで破綻はしない）。
