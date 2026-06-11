---
id: TKT-0241-consumption-unit-conversion
title: 消費フローの単位換算対応（換算マッチ＋g/パック切替消費＋分数残量）
status: ready
goal: 在庫の単位（例 パック・1パック=80g）とレシピの必要単位（例 g）が違うとき、単位換算が登録済みなら自動マッチせず消費もできない問題を解消する（ユーザー実例: 豚コマ 5パック・1パック=80g vs レシピ 豚こま肉 300g）
acceptance:
  - 在庫に unit_conversion（1 fromUnit = toQty toUnit, fromUnit=在庫単位）があり toUnit がレシピ材料の単位と一致する場合、料理完了の消費ダイアログで「おすすめ（同分類・同単位）」相当として扱われ、名前一致すれば自動選択される（豚コマ/パック/1パック=80g がレシピ 豚こま肉 300g に自動マッチ）
  - 自動選択時の初期消費量は レシピ単位で min(必要量, 在庫の換算後総量)（例 min(300, 5×80=400)=300g）
  - 換算マッチした行は消費量の単位をレシピ単位（g）と在庫単位（パック）で切り替えられる（行内の単位セレクタ。既定はレシピ単位）
  - 確定時は入力単位から在庫単位へ換算して減算する（300g → 300/80=3.75パック → 残 1.25。120g なら残 3.5）。同単位の既存挙動は不変
  - 在庫単位がパック等の分数許可単位なら、換算消費後の残量は在庫一覧で分数優先表示される（3.5 → 「3 1/2」。既存 displayQuantity/QuantityNotation を利用し、換算消費時は notation を "fraction" にする）
  - cooking_consumption_events への記録は consumed_amount/consumed_unit を**在庫単位**で保存する（rollback（computeRollbackQuantityUpdates）が quantity へ直接足し戻すため。requested_amount/requested_unit はレシピ単位のまま）。schema 変更はしない
  - 完了取り消し（TKT-0178 の巻き戻し）で換算消費分が在庫単位で正しく復元される（3.75 が足し戻る）
  - 行内の在庫不足警告（isShortage）と compareRecipeWithInventory / inventoryAmountByNameAndUnit の不足計算が換算を考慮する（5パック×80g=400g ≥ 300g なら不足扱いしない）
  - 換算が登録されていない単位違い在庫の挙動は現状維持（「その他の在庫（代替材料）」グループ・自動選択なし）
  - 換算ロジックは純粋関数として web/src/lib/inventory/ 配下に切り出し、単体テストを追加する（正方向・換算なし・fromQty/toQty 異常値・0除算ガード）
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/inventory/
  - web/src/lib/ingredients/name-match.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0125-cooking-completion-consumption-web
related_artifacts:
  - artifacts/TKT-0241-consumption-unit-conversion/verify.json
  - artifacts/TKT-0241-consumption-unit-conversion/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0241`（= `harness/bin/verify_web.sh`）
  - diff に inventory_items / cooking_consumption_events トークンが入るため supabase_schema_change が過剰マッチしうるが、schema/policy/migration は変更しない（CHECK制約 >=0 の範囲内・列追加なし）。report に明記する
  - 在庫数量の減算ロジックを変えるためデータ整合性に注意。実装は impl-deep（Opus）指定（ユーザー承認済みルーティング）
---

# Summary

ユーザー実例（2026-06-12 スクリーンショット確定）: 在庫「豚コマ」= 5パック・単位換算 1パック=80g、レシピ「豚こま肉」= 300g。名前は静的辞書で一致済みだが、`findMatchingStock` / おすすめ判定が `unit === ingredient.unit` の完全一致条件のため「その他の在庫（代替材料）」に落ち、自動選択されない。換算が登録されている場合はマッチさせ、g/パックどちらでも消費入力でき、在庫単位へ換算して減算する。

## 設計（オーケストレーター承認済み）

### 1. 換算ヘルパー（新規・純粋関数）

`web/src/lib/inventory/unit-conversion.ts`（新規）:

- `conversionFactorToUnit(item: Pick<StockItem,"unit"|"unit_conversion">, targetUnit: string): number | null`
  - `item.unit === targetUnit` → 1
  - `item.unit_conversion && fromUnit === item.unit && toUnit === targetUnit && fromQty > 0 && toQty > 0` → `toQty / fromQty`（例 80）
  - それ以外 → null（逆方向換算・連鎖換算はスコープ外）
- `stockAmountInUnit(item, targetUnit): number | null` … `quantity × factor`
- `convertToStockUnit(amount: number, item, inputUnit: string): number | null` … inputUnit が在庫単位なら素通し、toUnit なら `amount / factor`。`roundQuantity` で丸める
- 単位文字列は trim 比較（既存 normalizeUnitConversion と同様）

### 2. マッチング拡張

- `findMatchingStock`（name-match.ts）: unit 条件を「`item.unit === ingredientUnit` または `conversionFactorToUnit(item, ingredientUnit) !== null`」へ拡張。**name-match.ts は純粋関数群なので、unit 判定関数を引数 or オプションで注入するか、呼び出し側（recipe-meal-workspace）でフィルタを拡張するか、依存方向が崩れない方を実装者が選ぶ**（lib/ingredients → lib/inventory の import は許容範囲だが循環しないこと）
- `stockOptionsForIngredient` と ConsumptionEditor 内 rawOptions（おすすめグループ判定）も同条件に拡張し、換算マッチ品をおすすめ optgroup に出す（表示例: 「豚コマ / 5パック(=400g) / 冷凍庫」のような換算注記は任意・過剰実装しない）

### 3. ConsumptionDraft / UI

- draft に `consumeUnit: string` を追加（既定 = requestedUnit）。選択中在庫が換算マッチ（在庫単位 ≠ requestedUnit かつ factor あり）のときだけ、行内に単位セレクタ［レシピ単位 / 在庫単位］を表示
- NumberField の allowFraction は consumeUnit 基準（g なら分数なし、パックなら分数可）
- 在庫セレクタで別在庫へ切り替えたら consumeUnit を requestedUnit にリセット（換算不能な組合せを残さない）
- isShortage 判定: 入力量(consumeUnit) と 在庫量(consumeUnit 換算) を同一単位で比較

### 4. 確定（completeSchedule）

- 減算量 = `convertToStockUnit(consumedAmount, stockItem, consumeUnit)`（同単位なら従来どおり）。nextQuantity = `roundQuantity(max(0, quantity - 減算量))`
- `cooking_consumption_events` insert: `consumed_amount` = 在庫単位の減算量、`consumed_unit` = stockItem.unit。requested_* はレシピ単位のまま。**現行コードは consumed_unit に requestedUnit を入れており、rollback が在庫単位前提で足し戻すため、換算時に修正必須（同単位ケースでは従来と同値）**
- `setQuantityNotation`: consumeUnit ≠ stockItem.unit で換算消費した場合は "fraction"（残 3.5 を「3 1/2」表示）。同単位は従来どおり detectNotation

### 5. 不足計算

- `inventoryAmountByNameAndUnit`（recipe-meal-workspace.tsx:402）: unit 完全一致に加え `stockAmountInUnit(item, unit)` が非 null の在庫を換算量で合算
- これにより compareRecipeWithInventory（438）の不足警告・買い足し候補の二重計上がないこと（同一在庫が unit 一致と換算一致で二重に足されない実装にする）

### 6. スコープ外（やらない）

- 逆方向換算（レシピ=パック・在庫=g）・換算の連鎖
- 買い物リスト/staging 側の換算対応
- cooking-record-edit-modal（料理記録編集）の換算対応（在庫鮮度問題と同様、別チケット）
- supabase schema 変更・換算マスタ化

## 実装メモ

- 対象は `web/` のみ。Canvas版 `app.html` は凍結・参照専用
- 既存テストの流儀: ingredient-name-match.test.ts / recipe-meal-workspace.test.tsx / numeric 系。換算ヘルパーは新規テストファイル（例 inventory-unit-conversion.test.ts）
- テスト必須ケース: 豚コマ実例（5パック・1パック=80g・必要300g → 自動選択・初期300g・確定で残1.25パック・events は 3.75/パック）、120g 消費 → 残3.5 と「3 1/2」表示、巻き戻しで 3.75 復元、換算なし単位違いは従来どおり非マッチ、同単位の回帰なし

## 残リスク

- consumed_unit の意味が「レシピ単位」→「在庫単位」に変わる（同単位ケースは同値のため既存データへの影響なし。消費内訳の表示箇所が consumed_unit を使っていれば追従確認が必要 — 実装時に grep して report に記載）
