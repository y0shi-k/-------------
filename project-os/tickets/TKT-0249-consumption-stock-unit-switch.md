---
id: TKT-0249-consumption-stock-unit-switch
title: 消費ダイアログで在庫選択時に入力単位を在庫単位へ切替可能にする（換算不可ケースの救済）
status: draft
goal: レシピ「じゃがいも100g」に対し在庫「じゃがいも 3個」（換算未登録）のような単位不一致在庫を選んだとき、レシピ単位の数値がそのまま個数として誤って減算される問題を防ぎ、在庫単位のまま消費量を入力・正しく減算できるようにする
acceptance:
  - 消費ダイアログの単位セレクタの選択肢が「レシピ材料の単位＋選択中在庫の単位」になる（重複時は1つ。換算可否に関わらず在庫単位は常に選べる）
  - 換算が成立しない（conversionFactorToUnit が null の）在庫を選択したとき、consumeUnit が自動的に在庫単位へ切り替わる
  - 換算不可の在庫を選択したとき、レシピ単位の必要量（例 100g）が消費量入力値として在庫単位（個）にそのまま流用されない（入力値は空にするか在庫数量を上限とした値にし、acceptance 検証時に「100個」のような誤初期値が出ないこと）
  - 換算不可の在庫＋在庫単位入力で確定すると、入力値がそのまま在庫単位で減算される（在庫 じゃがいも3個・「1」個入力 → 残2個）。completeSchedule の換算失敗エラーでブロックされない
  - 換算不可の在庫＋レシピ単位（在庫単位と不一致）のままでは確定できず、単位切替を促すエラーメッセージが表示される（換算なしの誤減算を防ぐ）
  - cooking_consumption_events への記録は従来どおり consumed_amount/consumed_unit を在庫単位で保存し、完了取り消しで正しく復元される
  - 換算可の在庫（TKT-0241/0248 の挙動）・同単位在庫の既存挙動と既存テストが不変で green
  - buildConsumptionDrafts / updateConsumptionDraft / 確定ロジックの単位切替分岐にユニットテストを追加する
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
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
  - artifacts/TKT-0249-consumption-stock-unit-switch/verify.json
  - artifacts/TKT-0249-consumption-stock-unit-switch/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0249`（= `harness/bin/verify_web.sh`）
  - diff に inventory_items / cooking_consumption_events トークンが入るため supabase_schema_change が過剰マッチしうるが、schema/policy/migration は変更しない。report に明記する
  - 在庫数量の減算ロジックに触れるためデータ整合性に注意。TKT-0241 同様 impl-deep（Opus）相当の慎重実装を推奨
---

# Summary

料理完了の消費ダイアログ（`recipe-meal-workspace.tsx` 内 `ConsumptionEditor`）で、
在庫を選択したらその在庫の単位へ入力単位を切り替えられるようにする。
換算未登録の単位不一致在庫（じゃがいも 個 vs レシピ g）でも、在庫単位で量を入力して
正しく減算できるようにする（方針はユーザー承認済み: その場での換算登録 UI は作らない）。

## 実装メモ

- 対象は `web/src/components/recipe-meal-workspace.tsx`（約5,100行の大型コンポーネント）。主な変更箇所:
  - `ConsumptionEditor`（L.4045 付近）: 単位セレクタの選択肢生成と「在庫を選ぶ」セレクト（L.4167-4191 付近）。
  - `updateConsumptionDraft`（L.1290 付近）: 在庫切替時の `consumeUnit` リセット処理。ここに「換算不可なら在庫単位へ自動切替」を入れる。
  - `buildConsumptionDrafts`（L.1267 付近）: 初期消費量。換算不可在庫が初期選択されるケースの初期値に注意。
  - `completeSchedule`（L.2384 付近、換算は L.2444-2456）: `convertToStockUnit` が null を返すと現状エラーでブロック。consumeUnit=在庫単位なら係数1で通す（`convertToStockUnit` は同単位で 1 を返すため、consumeUnit を在庫単位にすれば既存ロジックで通る想定。通らない経路がないか確認）。
- 換算可否判定は `conversionFactorToUnit`（`web/src/lib/inventory/unit-conversion.ts`）。**先行 TKT-0248 で逆方向対応済みの前提**で、この関数の null/非null を唯一の判定に使う。
- TKT-0241 の不変条件: consumed_amount/consumed_unit は在庫単位で保存（rollback `computeRollbackQuantityUpdates` が quantity へ直接足し戻すため）。requested_amount/requested_unit はレシピ単位のまま。
- 「その他の在庫（代替材料）」グループ（換算不可在庫）の分類自体は現状維持でよい。選択後の挙動だけ救済する。
- 既存テストの場所: `web/src/__tests__/`。コンポーネントテストは cross-board-sync.test.tsx 等のパターンを参照。
- 共通規約: イミュータブル更新、GAS/Spreadsheet/Drive 不使用、秘密直書き禁止。schema/RLS は触らない。

## 非ゴール

- 消費ダイアログ内での unit_conversion の新規登録 UI（ユーザー判断で見送り。必要になったら別チケット）
- 換算ロジック自体の変更（TKT-0248 で完了済みの前提）
- 在庫編集フォーム・買い物リスト・staging の単位 UI
- schema / RLS / Storage の変更

## 依存チケット

- TKT-0248（単位換算の逆方向対応）の完了後に着手する

## 残リスク

- 5,100行コンポーネント内の draft 状態遷移が複雑で、在庫切替→単位切替→入力の順序によっては stale な consumeUnit が残る可能性。単位切替分岐のユニットテストでカバーする。
- 換算不可＋レシピ単位確定をエラーにする仕様は、従来「そのまま減算」していた（壊れた）挙動の変更にあたる。report に挙動変更として明記する。
