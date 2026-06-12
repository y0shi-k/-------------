---
id: TKT-0248-unit-conversion-bidirectional
title: 単位換算の逆方向対応（レシピ単位=在庫のfromUnit側でも換算成立させる）
status: draft
goal: unit_conversion が「在庫単位→レシピ単位」の正方向にしか効かず、レシピ=個・在庫=g（換算が逆向きに登録されている）ケースで自動マッチ・換算消費・不足計算が効かない問題を解消する（TKT-0241 の残課題）
acceptance:
  - conversionFactorToUnit が逆方向も解決する。在庫単位=conversion.toUnit かつ targetUnit=conversion.fromUnit のとき、係数 fromQty/toQty を返す（例 在庫 g・{1個=200g} で targetUnit="個" → 1/200）
  - 逆方向で toQty が 0 以下・fromQty が 0 以下・非有限数の場合は null（既存の正方向ガードと同等）
  - stockAmountInUnit / convertToStockUnit が逆方向換算でも正しい値を返す（例 在庫 じゃがいも 600g・{1個=200g}、レシピ「じゃがいも 2個」→ stockAmountInUnit=3個、convertToStockUnit(2,"個")=400g 減算）
  - findMatchingStock のおすすめ昇格・自動選択が逆方向換算でも成立する（分類一致＋名前一致＋逆方向換算可の在庫が自動選択される）
  - compareRecipeWithInventory / inventoryAmountByNameAndUnit の不足計算が逆方向換算を考慮する
  - 既存の正方向・同単位の挙動とテスト（inventory-unit-conversion.test.ts 既存14件ほか）が不変で green
  - 逆方向のユニットテストを追加する（正常系・0除算ガード・丸め・convertToStockUnit の往復）
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/inventory/unit-conversion.ts
  - web/src/__tests__/inventory-unit-conversion.test.ts
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0125-cooking-completion-consumption-web
related_artifacts:
  - artifacts/TKT-0248-unit-conversion-bidirectional/verify.json
  - artifacts/TKT-0248-unit-conversion-bidirectional/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0248`（= `harness/bin/verify_web.sh`）
  - diff に inventory_items 系トークンが入ると supabase_schema_change が過剰マッチしうるが、schema/policy/migration は変更しない。report に明記する
  - 純粋関数の変更のみ。UI 変更は後続 TKT-0249 で行う
---

# Summary

TKT-0241 で導入した単位換算（`web/src/lib/inventory/unit-conversion.ts`）は
「fromUnit=在庫単位 → toUnit=レシピ単位」の正方向のみ対応。本チケットで逆方向
（在庫単位=toUnit、レシピ単位=fromUnit）も係数の逆数で解決できるようにする。
`stockAmountInUnit` / `convertToStockUnit` / `findMatchingStock` / 不足計算は
`conversionFactorToUnit` の係数経由で動くため、本関数の拡張で自動的に恩恵を受ける。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）。現役正本は `web/` + `supabase/`。Canvas版 `app.html` は凍結・参照専用。
- 換算ロジック正本: `web/src/lib/inventory/unit-conversion.ts`
  - `conversionFactorToUnit(item, targetUnit)`: 在庫単位1あたりの targetUnit 量を返す。ここに逆方向分岐を追加する。
  - `stockAmountInUnit` / `convertToStockUnit` は係数経由なので原則変更不要（丸め `roundQuantity` の挙動だけ確認）。
- データ形式: `inventory_items.unit_conversion`（JSONB）= `{fromQty, fromUnit, toQty, toUnit}`。型は `web/src/lib/inventory/types.ts` の `UnitConversion`。
- マッチング: `web/src/lib/ingredients/name-match.ts` の `findMatchingStock`（L.269 付近）が `conversionFactorToUnit !== null` で昇格判定。変更不要のはずだが逆方向ケースのテストで確認する。
- 消費フローの利用箇所: `web/src/components/recipe-meal-workspace.tsx`（`completeSchedule` L.2384, `inventoryAmountByNameAndUnit` L.407 付近）。
- TKT-0241 の決定: consumed_amount/consumed_unit は**在庫単位**で保存（rollback 整合）。逆方向でもこの不変条件を崩さない。
- 既存テスト: `web/src/__tests__/inventory-unit-conversion.test.ts`（豚コマ実例14件）。同パターンで逆方向ケースを追加する。
- イミュータブル・直書き秘密禁止などの共通規約に従う。GAS/Spreadsheet/Drive は使わない。

## 非ゴール

- 消費ダイアログの単位セレクタ・在庫選択時の単位自動切替（TKT-0249）
- 換算未登録食材の救済（TKT-0249）
- 連鎖換算（A→B→C）・換算マスタの新設・schema 変更
- 買い物リスト / staging への換算適用

## 依存チケット

- なし（本イニシアチブの土台。TKT-0249 が本チケットに依存）

## 残リスク

- 逆方向係数（1/200 等）の浮動小数で丸め誤差が出うる。`roundQuantity` の丸め桁で吸収できるかテストで確認する。
