---
ticket_id: TKT-0220-amount-badge-svg-background
status: ready
---

# Report Draft

## 変更目的

調理ビューの手順内で `大さじ1` / `小さじ1/2` を読み間違えにくくするため、単位と数値を分けて表示した。単位側にはスプーンSVGを重ね、バッジ内に閉じ込めず行の余白へ少しはみ出す見た目にした。

## 実装内容

- `recipe-meal-workspace.tsx`
  - `cookingAmountChip()` で大さじ/小さじだけ単位バッジと数値バッジへ分割。
  - 外側の `.cooking-amount-chip` に `aria-label="大さじ1"` のような元表記を残し、読み上げ上の意味を維持。
- `globals.css`
  - `.cooking-measure-unit` が「大さじ/小さじ」単位バッジ。
  - `.cooking-measure-unit::before` がスプーンSVGの表示位置・サイズ・重なり順の調整点。
  - `.cooking-measure-value` が数値バッジ。大さじは赤系、小さじは青系。
- `web/public/images/measurements/`
  - `tablespoon-spoon-a.svg` / `teaspoon-spoon-a.svg` が現在の実表示。
  - `*-b.svg` / `*-c.svg` は比較用パターン。

## 後で見た目を調整する場所

- スプーンのはみ出し位置:
  - `web/src/app/globals.css` の `.cooking-measure-unit::before`
  - 主な値: `left`, `width`, `height`, `opacity`, `z-index`
- スプーンが上下左右で欠ける場合:
  - `web/public/images/measurements/tablespoon-spoon-a.svg`
  - `web/public/images/measurements/teaspoon-spoon-a.svg`
  - 主な値: `<svg viewBox="-24 -20 228 104">`
- 大さじの赤:
  - `.cooking-amount-chip[data-unit="大さじ"]`
  - `.cooking-amount-chip[data-unit="大さじ"] .cooking-measure-unit`
  - `.cooking-amount-chip[data-unit="大さじ"] .cooking-measure-value`
- 小さじの青:
  - `.cooking-amount-chip[data-unit="小さじ"]`
  - `.cooking-amount-chip[data-unit="小さじ"] .cooking-measure-unit`
  - `.cooking-amount-chip[data-unit="小さじ"] .cooking-measure-value`
  - `teaspoon-spoon-a/b/c.svg`
- バッジの横幅や行内の詰まり:
  - `.cooking-measure-unit` の `min-width`, `padding`, `font-size`
  - `.cooking-measure-value` の `min-width`, `padding`, `font-size`

## 実施した確認

- `npm run test -- recipe-meal-workspace.test.tsx`: 成功（61 tests passed）
- `cd web && npm run lint && npm run typecheck && npm run test && npm run build`: lint/typecheck/test 成功、最初の build 終盤だけ `.next` 生成物の一時 ENOENT
- `npm run build`: 再実行で成功
- 全体テスト: 38 files / 377 tests passed

## 残リスク

- 実機/ブラウザでの最終目視は必要。特に手順が複数行に折り返す場合、スプーンのはみ出しが上下行や隣のバッジに近く見える可能性がある。
- `photo_upload_storage` や `supabase_schema_change` に見える語彙が出る可能性はあるが、今回の変更は public 静的SVG、CSS、React表示のみ。Supabase Storage、DB schema、Auth/RLS、AI route、CSV移行は変更していない。

## 次の依頼や人判断

- さらに目立たせたい場合は `.cooking-measure-unit::before` の `opacity` を上げる。
- 欠けが残る場合はSVGの `viewBox` を広げる。
- バッジ同士が近すぎる場合は `.cooking-amount-chip` の `margin` または `.cooking-measure-unit::before` の `width` を調整する。
