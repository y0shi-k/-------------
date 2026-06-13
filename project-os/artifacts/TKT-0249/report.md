---
ticket_id: TKT-0249-consumption-stock-unit-switch
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

料理完了の消費ダイアログで、レシピ「じゃがいも 100g」に対し在庫「じゃがいも 3個」（unit_conversion 未登録）のような
**単位不一致・換算不能な在庫**を選んだとき、レシピ単位の数値（100）がそのまま個数として誤減算される問題を防ぐ。
換算未登録でも在庫単位（個）で量を入力して正しく減算できるようにする。方針はユーザー承認済みで、
その場での換算登録 UI は作らない（換算不可なら在庫単位で入力させる救済のみ）。

## 今回追加した安全装置

- **入力単位の自動切替**: 換算不能（`conversionFactorToUnit === null`）かつ単位不一致の在庫を選ぶと、
  consumeUnit を在庫単位へ自動切替し、入力値を `"0"` にリセットする（レシピ単位の必要量 100 を個数 100 として
  誤流用しない）。換算可・同単位・未選択は従来どおりレシピ単位を維持。
- **確定時の換算ブロック**: 換算不可在庫を選んだまま consumeUnit がレシピ単位（在庫単位と不一致）で確定しようとすると、
  在庫単位とレシピ単位を明示した専用エラー「消費量の単位を在庫の単位（◯◯）へ切り替えてください」でブロックし、
  換算なしの誤減算を物理的に防ぐ。
- **判定ロジックの純粋関数化**: 入力単位決定と在庫単位換算の分岐を `web/src/lib/recipes/consumption-units.ts`
  （`resolveConsumeUnitForStock` / `resolveConsumedStockAmount`）へ切り出し、5,171行コンポーネントの状態遷移に
  依存せず単体テストできるようにした（TKT-0248 の unit-conversion.ts 純粋関数化と同じ流儀）。
- **データ整合性の不変条件維持**: cooking_consumption_events への保存は従来どおり consumed_amount=在庫単位換算量・
  consumed_unit=在庫単位（insert 部は無変更）。consumeUnit を在庫単位にすれば `convertToStockUnit` の同単位素通しで
  通り、TKT-0241 の rollback 不変条件（consumed_* は在庫単位・quantity へ直接足し戻す）が自動的に守られる。

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0249` → **status: pass**（lint / typecheck / test / build すべて pass）。
- policy: no_gas_dependency=pass / no_hardcoded_secret=pass / supabase_rls_present=pass / backlog_focus_lean=pass。
- 新規 `web/src/__tests__/consumption-units.test.ts`（10件）で各 acceptance 分岐を網羅:
  - 換算不可在庫選択 → consumeUnit=在庫単位・resetAmount=true。
  - 換算可（パック→g）・同単位・未選択 → レシピ単位維持（既存挙動不変）。
  - 換算不可＋在庫単位入力「1」→ consumedStockAmount=1・converted=false（在庫3個→残2個に相当）。
  - 換算不可＋レシピ単位 → ok:false（unit-switch-needed）でブロック。
  - 換算可＋レシピ単位g「160」→ 2パック（converted=true）等、既存換算経路の不変。
- 既存テスト不変 green: inventory-unit-conversion / recipe-meal-workspace / cooking-history-rollback を含む 111 件。

## 残リスク

- **挙動変更点**: 「換算不可＋レシピ単位のまま確定」は、従来そのまま（誤って）減算していた壊れた挙動を
  エラーブロックへ変更している。意図どおりだが、ユーザーから見える挙動変更として明記する。
- 純粋関数抽出は最小限（2関数）に留め、コンポーネントの draft 状態遷移自体は変えていない。
  在庫切替→単位手動切替→入力の順序依存は既存 onChange 経路のままで、テストは純粋関数層で網羅。
- 実機スモーク（タブレット/375px/PC幅での操作）はユーザー作業として残る（manual-smokes.md 参照）。

## 次の依頼や人判断

- 実機スモーク: 換算未登録の単位不一致在庫（例 じゃがいも 個 / レシピ g）で
  ①在庫選択時に単位が在庫単位へ切り替わり入力が空になる ②在庫単位で入力して正しく減算される
  ③レシピ単位へ戻して確定するとエラーで止まる、を確認する。
- supabase_schema_change eval はテーブル名トークン（inventory_items / cooking_consumption_events）の
  過剰マッチで点灯したもので、**schema / RLS / Storage / migration は無変更**（編集は web/src/ のみ）。
