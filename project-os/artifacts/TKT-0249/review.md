---
ticket_id: TKT-0249-consumption-stock-unit-switch
status: passed
review_scope:
  - SPEC-0125-cooking-completion-consumption-web
  - TKT-0249-consumption-stock-unit-switch
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/recipes/consumption-units.ts（新規・純粋関数 2 件）
- web/src/components/recipe-meal-workspace.tsx（3 箇所: updateConsumptionDraft / completeSchedule 換算 / ConsumptionEditor 単位セレクタ表示条件）
- web/src/__tests__/consumption-units.test.ts（新規・10 件）

（注: web/src/lib/inventory/unit-conversion.ts と inventory-unit-conversion.test.ts の差分は先行 TKT-0248 の
未コミット分であり、本チケットの変更ではない。）

## checked_artifacts

- verify.json（status: pass / lint・typecheck・test・build すべて pass / policy 4 項目 green）
- report.md / manual-smokes.md（本セッションで作成）

## subagent_usage

- impl-deep（Opus）に実装を委譲。route_model.py の機械判定は impl-fast(Sonnet) だったが、ticket owner_notes の
  「在庫減算ロジックに触れるため TKT-0241 同様 impl-deep 相当の慎重実装を推奨」に従いオーケストレーターが impl-deep へ昇格。
- オーケストレーター側で diff・新規モジュール・テストを全レビューした（下記 findings）。

## findings

- **データ整合性（最重要）**: cooking_consumption_events への insert（consumed_amount=`row.consumedStockAmount`、
  consumed_unit=`row.stockItem.unit`）は無変更。`consumedStockAmount` の供給元を `convertToStockUnit` 直呼びから
  `resolveConsumedStockAmount` の結果へ差し替えただけで値は同値。TKT-0241 の rollback 不変条件（consumed_* は在庫単位で
  保存し quantity へ直接足し戻す）は維持。問題なし。
- **誤ブロックの不在**: `resolveConsumedStockAmount` が ok:false を返すのは `convertToStockUnit` が null のときのみ。
  consumedAmount<0 は手前の invalidDraft で、=0 は continue で除外済みのため、null は「換算不可在庫×レシピ単位」のみに対応。
  正当な入力を誤ってブロックしない。問題なし。
- **既存挙動の不変**: `converted = consumeUnit !== stockItem.unit` は従来式と同一。換算可在庫・同単位在庫の経路は
  純粋関数経由でも同結果（テストで 160g→2パック・同単位素通し等を固定）。問題なし。
- **UI 条件変更の妥当性**: 単位セレクタ表示を `canConvert`（換算成立かつ単位不一致）から
  `showUnitSelector`（単位不一致のみ）へ緩和。換算不可在庫でも在庫単位を選べる経路を確保し、エラー復帰経路も成立。
  `canConvert` は他で未使用だったため削除済み。`stockInConsumeUnit`/`isShortage` 等の不足判定は不変。問題なし。
- **イミュータブル更新**: updateConsumptionDraft は `{ ...item, ...values }` を基点に next を組み立て、元 state を破壊しない。問題なし。

## open_risks

- 「換算不可＋レシピ単位のまま確定」をエラー化したのは従来の壊れた誤減算からの挙動変更。意図どおり。
- schema/RLS/Storage は無変更（supabase_schema_change はテーブル名トークンの過剰マッチ）。本レビューでも実 schema 変更なしを確認。

## verdict

pass — 在庫減算・消費履歴・rollback の不変条件を崩さずに acceptance を満たす。マージ可。実機スモーク（manual-smokes.md）のみ残。
