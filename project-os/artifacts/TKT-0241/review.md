---
ticket_id: TKT-0241-consumption-unit-conversion
status: passed
review_scope:
  - SPEC-0125-cooking-completion-consumption-web
  - TKT-0241-consumption-unit-conversion
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/inventory/unit-conversion.ts（新規。正方向換算のみ・ガード網羅を確認）
- web/src/lib/ingredients/name-match.ts（findMatchingStock の unit 条件拡張。lib/ingredients → lib/inventory の import は一方向で循環なし）
- web/src/components/recipe-meal-workspace.tsx（おすすめ判定 / draft.consumeUnit / 単位セレクタ / 確定時換算減算 / events 在庫単位保存 / notation fraction / 不足計算換算合算）
- web/src/__tests__/（inventory-unit-conversion 新規14件・name-match +・workspace 69件・rollback 5件）

## checked_artifacts

- artifacts/TKT-0241/verify.json（status: pass）
- artifacts/TKT-0241/report.md
- artifacts/TKT-0241/manual-smokes.md（ローカルSupabase + Playwright ブラウザE2E・全green）

## subagent_usage

- 実装: impl-deep（Opus）。在庫減算という整合性影響の大きい変更のためオーケストレーターが deep を指定（ユーザー承認済みルーティング）
- 設計・レビュー・E2E検証: オーケストレーター（Fable 5 メインセッション）。チケットに設計を明文化してから委譲

## findings

- 設計どおりの実装。サブエージェントの自主判断3点（換算失敗時の確定ブロック / 単位切替時の消費量0リセット / 単位セレクタ専用CSSなし）はいずれも妥当
- 最重要ポイントの consumed_amount/consumed_unit の在庫単位保存は、rollback（computeRollbackQuantityUpdates が quantity へ直接加算）との整合がとれており、巻き戻しテストで固定済み。同単位ケースは従来と同値でデータ互換
- consumed_unit 表示利用箇所の調査結果（cooking-record-edit-modal の「前回 …」のみ・在庫単位表示はデータと整合）を確認
- 不足計算の換算合算は conversionFactorToUnit が同単位/換算を排他評価するため二重計上なし
- ブラウザE2E（manual-smokes 参照）でユーザー実例（5パック・80g/パック・必要300g・120g消費→3 1/2パック）を最後まで確認

## open_risks

- cooking-record-edit-modal の換算UI非対応（整合は崩れない・別チケット候補）
- 食材管理ボードの残量即時反映（既知のボード間問題の在庫ボード側・別チケット候補）

## verdict

passed — verify 全pass・単体153件 green・ブラウザE2Eでユーザー実例を実証。ユーザー実機確認のみ残
