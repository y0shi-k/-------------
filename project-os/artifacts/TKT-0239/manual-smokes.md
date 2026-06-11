---
ticket_id: TKT-0239-consumption-dialog-inventory-refetch
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（ticket の required_evals）
- `/check-gates` の supabase_schema_change は `inventory_items` トークンの過剰マッチ。実体は読み取り select の追加のみで schema / policy / migration 無変更（既存 RLS の user_id スコープ内）。photo_upload_storage はチケットmd・並行チケット語彙の過剰マッチで、写真・Storage 経路に変更なし。

## executed_checks

- `npx vitest run src/__tests__/recipe-meal-workspace.test.tsx` → 65件 全パス（新規2件: リフェッチ反映・失敗時フォールバック）
- `npx vitest run`（cooking-record-edit-modal / cooking-history-edit）→ 23件 無影響確認
- `tsc --noEmit` エラーなし、`bash harness/bin/verify_web.sh TKT-0239` → 全 pass（オーケストレーターの try/catch 追補後に再実行）
- diff 静的確認: 書き込み系クエリ・schema・policy の変更が一切ないこと（select 追加のみ）

## skipped_checks

- 実機での一連フロー確認（食材管理で在庫追加 → 再読込なしで料理完了 → 自動マッチ）: 本番相当データを持つ環境がないためスキップ。手順は report.md「次の依頼や人判断」参照
- 豚こま肉の実データ切り分け（単位/分類不一致ケースの可能性）: ユーザーの在庫データに依存するためユーザー側で確認

## open_risks

- ユーザー事象が単位/分類不一致だった場合は本修正で解消しない（report.md 残リスク参照）
- cooking-record-edit-modal の在庫鮮度問題は意図的見送り（理由は report.md。必要なら別チケット）
