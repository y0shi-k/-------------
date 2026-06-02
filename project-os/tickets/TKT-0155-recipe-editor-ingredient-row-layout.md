---
id: TKT-0155-recipe-editor-ingredient-row-layout
title: レシピ編集モーダルの材料行レイアウト改善（単位ピッカーの縦積み崩れ解消・TKT-0154 のコンセプト適用）
status: completed
goal: レシピ編集モーダルの材料/調味料行で、64px列に押し込まれて縦積みに崩れていた単位ピッカーを、モーダル幅拡張＋単位列拡大＋nowrap化で1行に収め、数量・単位入力を在庫モーダル（TKT-0154）と揃えて使いやすくする
acceptance:
  - 材料/調味料行の単位ピッカーが横一列で表示され、`{×, ×, +` のような縦積み崩れが無い
  - 品名・数量・単位・削除が1行（インライン）に収まり、数量・単位に十分な幅がある
  - モーダル幅が在庫モーダル（720px）と統一され、見た目が TKT-0154 と揃う
  - ブラウザ幅 520px 以下でも材料行が1行を維持し破綻しない
  - ジャンルタグピッカー・在庫モーダルの単位ピッカーに副作用が無い
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0155-recipe-editor-ingredient-row-layout/
related_specs:
  - SPEC-0155-recipe-editor-ingredient-row-layout
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_artifacts:
  - artifacts/TKT-0155-recipe-editor-ingredient-row-layout/verify.json
  - artifacts/TKT-0155-recipe-editor-ingredient-row-layout/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（CSSのみ）。Supabase schema / Auth・RLS / 写真Storage / AI route / CSV移行は触らない。JSX（`recipe-meal-workspace.tsx`）も変更しない。
  - `.genre-*` のベース定義（L3147-3273、ジャンルピッカー・在庫の単位ピッカー共用）は変更しない。追加指定はすべて `.canvas-recipe-item-row` スコープに限定する。
  - verify は `/verify TKT-0155-recipe-editor-ingredient-row-layout`（= `harness/bin/verify_web.sh`）。
  - Canvas版 `app.html` は触らない。対象は `web/src/app/globals.css` のみ（`supabase/` も触らない）。
  - 目視確認: 単位ピッカーが1行で表示・崩れ無し／品名・数量・単位・削除が1行／≤520pxでも1行維持／在庫モーダルと見た目が揃う。
---

# Summary

「レシピを編集」モーダルの材料/調味料行で、数量・単位入力が狭く使いにくい問題を、TKT-0154 と同じコンセプト（モーダル幅拡張 + 単位ピッカーに十分な幅 + nowrap 化）で解消する。詳細仕様は `SPEC-0155-recipe-editor-ingredient-row-layout` を正本とする。レイアウトは1行インライン維持（ユーザー確定）。

## 背景

TKT-0154 で導入した `UnitPicker`（タグ＋検索input＋アイコン2つを持つ52px高フィールド）が、レシピ材料行のグリッド `20px minmax(0,1fr) 64px 64px 36px` の **64px幅の単位列**に押し込まれ、`.genre-field { flex-wrap: wrap }` で折り返して縦積みに崩れていた。在庫モーダルは `.qty-unit-wrap`（globals.css L5242-5280）の nowrap 指定で崩れを防いでいるが、レシピ行には同等指定が無かった。

## 変更内容（`web/src/app/globals.css` のみ）

1. `.recipe-editor-modal` 幅 `672px → 720px`（在庫モーダルと統一）。
2. `.canvas-recipe-item-row` グリッド `... 64px 64px ... → ... 5rem 10rem ...`（数量約5rem・単位約10rem）。
3. `.canvas-recipe-item-row` スコープで単位ピッカーを nowrap 化（`.qty-unit-wrap` を踏襲）。
4. `@media (max-width: 520px)` の材料行グリッドと `.genre-input` min-width を狭幅向けに調整（1行維持）。

## 実装メモ

- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`。現役正本: `web/`。
- GAS/Spreadsheet/Drive は使わない。APIキー等の秘密は直書きしない。
- 本変更は DB・RLS・Storage に触れないため、RLS/Storage権限の確認は対象外。

## 残リスク

- 単位タグが極端に長い場合は 10rem 列で省略表示（`text-overflow: ellipsis` 済みで破綻なし）。
