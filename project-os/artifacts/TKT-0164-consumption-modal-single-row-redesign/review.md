---
ticket_id: TKT-0164-consumption-modal-single-row-redesign
status: passed
review_scope:
  - SPEC-0164-consumption-modal-single-row-redesign
  - TKT-0164-consumption-modal-single-row-redesign
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- `web/src/components/recipe-meal-workspace.tsx`
  - `ConsumptionDraft` 型から `selected` を削除、`ConsumptionBulkMode` 型を追加。
  - `setVisibleConsumptionSelected` → `setVisibleConsumptionAmount(mode)`（default=在庫選択行に min(必要量,在庫)、zero=0）。
  - `buildConsumptionDrafts` の `selected` 設定撤去。
  - `completeSchedule`: バリデーションを stockItemId 保有行のみに、減算ゲートを `if (!draft.stockItemId || draft.consumedAmount === 0) continue;` に変更。
  - `ConsumptionEditor`: props を `onBulkSet` に、`isShortage` から `selected` 除去（amount>0 条件追加）、ツールバーを「全部 既定量／全部 0」に、行を `.consumption-row` で1行高密度化、消費量を `NumberField`＋単位表示に、「減算しない」廃止（未選択は「在庫を選ぶ」、在庫なしは「対象在庫なし」）。
- `web/src/app/globals.css`
  - 完了モーダル専用クラス（`.consumption-row` / `-top` / `-label` / `-controls` / `.consumption-amount` / `.consumption-unit` / `.consumption-row-nostock`）を新規追加。`.consumption-item` 系は無改変。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 完了モーダルテストを新設計（一括ボタン名、消費量0で除外）に更新。

## checked_artifacts

- `verify.json`: status=pass（lint/typecheck/test/build, policy すべて pass）。
- `report.md`: 変更目的・安全装置・確認・残リスクを記載。
- `manual-smokes.md`: 自動テストで確認した観点と、実機で残る観点を分離して記載。

## subagent_usage

- なし（単一コンポーネント中心の変更のため、メインで直接実装・レビュー）。

## findings

- 在庫書き込み（`inventory_items` 更新、`cooking_consumption_events` 挿入）のDB呼び出し自体は不変で、減算ゲートの条件（selected 依存の撤去）のみ変更。スキーマ／RLS／Storage には非該当を確認。
- 料理履歴編集モーダルの固有意味（チェックOFF＝明細削除＋在庫差分戻し）を壊さないため、当該ファイルと共有CSSを無改変に保ったことを確認。
- `selected` の別用途（shortageSelection 等）への波及がないことを grep で確認。
- `check-gates` の `supabase_schema_change` 🔴は ticket/spec/plan 本文のテーブル名記載による誤検出。実コードはスキーマ変更なし。

## open_risks

- 実Supabaseでのエンドツーエンド確認は未実施（manual-smokes の open_risks 参照）。
- 編集モーダルとの見た目不揃いは別チケット候補。

## verdict

- pass。完了モーダルのスコープに限定され、危険領域（編集モーダルの在庫差分・スキーマ）に波及なし。実機スモークを推奨事項として残す。
