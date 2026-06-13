---
ticket_id: TKT-0248-unit-conversion-bidirectional
status: ready
---

# Report Draft

## 変更目的

TKT-0241 で導入した単位換算（`web/src/lib/inventory/unit-conversion.ts`）は
「在庫単位=fromUnit → レシピ単位=toUnit」の正方向のみ対応で、レシピ=個・在庫=g
のように換算が逆向きに登録されたケースで自動マッチ・換算消費・不足計算が効かなかった。
本チケットで逆方向（在庫単位=toUnit、レシピ単位=fromUnit）も係数の逆数で解決できるようにした。
純粋関数のみの変更で、UI は変更していない（後続 TKT-0249）。

## 今回追加した安全装置

- `conversionFactorToUnit` は正方向を優先評価し、合致しない場合のみ逆方向を試す形にした。
  既存の同単位（→1）・正方向の挙動は不変。
- 逆方向ヘルパー `validReverseConversion` を追加し、`fromQty>0 && toQty>0 && 両方有限`
  を満たさなければ null。最終 factor も `Number.isFinite(factor) && factor>0` のときだけ返す
  （正方向ガードと同等）。
- `stockAmountInUnit` / `convertToStockUnit` は `conversionFactorToUnit` 経由のため追加変更なし。
  逆方向係数（1/200 等）の浮動小数誤差は既存 `roundQuantity` で吸収されることをテストで確認。
- schema/policy/migration は一切変更していない。diff に inventory_items 系トークンが含まれても
  supabase_schema_change の過剰マッチであり、DB 変更は無い。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0248`：status **pass**
  - lint / typecheck / test（全574件）/ build：すべて pass
  - policy：no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass
- 逆方向ユニットテストを追加（`web/src/__tests__/inventory-unit-conversion.test.ts`）:
  - `conversionFactorToUnit` 逆方向正常系2件＋ガード4件（fromQty/toQty が 0・負・NaN → null）
  - `stockAmountInUnit` 逆方向正常系2件
  - `convertToStockUnit` 逆方向正常系2件＋往復同値性1件
- 既存テストのうち「逆方向は null」という旧仕様を前提にしていた1件を、新仕様（逆数を返す）に更新。

## 残リスク

- なし。pure function のみの変更。findMatchingStock / 不足計算は `conversionFactorToUnit`
  経由で自動的に逆方向の恩恵を受ける（係数 API は不変）。

## 次の依頼や人判断

- TKT-0249（消費ダイアログの単位セレクタ・在庫選択時の単位自動切替・換算未登録食材の救済）が本チケットに依存。
