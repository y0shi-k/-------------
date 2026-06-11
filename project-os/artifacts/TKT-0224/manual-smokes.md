---
ticket_id: TKT-0224-shopping-shortage-name-match
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- supabase_schema_change / photo_upload_storage は diff 中の `meal_schedules`/`recipes`/`photo` 等のトークンによる自動マッチ。本チケットはクライアント側の不足判定1関数の変更のみで、schema・Storage・INSERT 経路は無変更（チケット owner_notes で予見済み）。

## executed_checks

- ユニットテスト（vitest 377件全パス）で次を確認:
  - 在庫「卵 3個」×レシピ「たまご 2個」のスケジュール追加で不足モーダルが開かない（辞書一致の合算）。
  - 在庫「卵 1個」×レシピ「たまご 3個」で不足 2個 として INSERT される（差分計算の正しさ）。
  - 在庫「豚こま切れ肉」×レシピ「豚肉」は従来どおり不足として出る（部分一致は合算しない）。
  - 単位不一致（個×g）は合算しない。
  - 既存の不足モーダル系テスト（完全一致ケース）が無変更で通過（回帰なし）。
- コードレビューで `confirmRecipeShortageSelection`（INSERT）・`compareRecipeWithInventory` のシグネチャ・`supabase/` 配下に変更がないことを確認。

## skipped_checks

- 実機・実ブラウザでの不足モーダル/在庫不足バッジの目視（判定はテストで担保。表示構造は無変更）。

## open_risks

- なし（判定の変更はクライアント側のみで、買い物リストへの書き込みはユーザー確定操作を経る従来フローのまま）。
