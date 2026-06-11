---
ticket_id: TKT-0223-consumption-stock-auto-match
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
- supabase_schema_change / photo_upload_storage は diff 中の `cooking_history`/`recipes`/`photo` 等のトークンによる自動マッチ。本チケットはクライアント側の紐付け・候補並び順のみで、schema・Storage・在庫減算ロジック（`computeInventoryAdjustments`）は無変更（チケット owner_notes で予見済み）。

## executed_checks

- ユニットテスト（vitest 373件全パス）で次を確認:
  - 在庫「卵」×レシピ「たまご」が辞書一致で自動選択される（履歴編集経路 `buildDraftsFromRecipeIngredients`）。
  - 部分一致のみ（在庫「豚こま切れ肉」×レシピ「豚肉」）は自動選択されない。
  - 複数候補時は完全一致 > 正規化一致の優先順で選ばれる。
  - `ConsumptionEditList` に「おすすめ（同分類・同単位）」optgroup が表示される（2件）。
  - 既存の完全一致ケース（玉ねぎ）の調理完了フローが従来どおり動く（回帰なし）。
- コードレビューで以下を確認:
  - `supabase/` 配下・migration・`.from(...)` の書き込み経路に変更なし。
  - 既存フィルタ条件（分類・単位・在庫>0）の維持。

## skipped_checks

- 実機・実ブラウザでの消費量モーダル目視（optgroup の見え方・自動選択の体感）。ロジックはテストで担保済みで、データ書き込み経路は無変更のため静的確認で足りると判断。

## open_risks

- 実ブラウザでの optgroup 表示確認が未実施（表示のみ。データ破壊リスクなし）。
