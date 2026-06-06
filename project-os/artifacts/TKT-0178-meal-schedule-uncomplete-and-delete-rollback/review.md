---
ticket_id: TKT-0178-meal-schedule-uncomplete-and-delete-rollback
status: passed_with_manual_db_gap
review_scope:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/cooking-history/rollback.ts
  - web/src/components/delete-confirm-panel.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
---

# Review Record

## findings

- Blocking findings: なし。
- 巻き戻し順序は `events読込 -> inventory_items復元 -> cooking_consumption_events削除 -> cooking_history削除 -> meal_schedules更新/削除`。`meal_schedules` を先に消して関連IDを失う問題は避けている。
- 削除/更新/取得クエリは `user_id` 条件付き。ブラウザ側で Service Role key や秘密鍵は使っていない。
- `photos` テーブルと Storage の削除処理は追加していない。`cooking_history` 削除時の写真紐付け解除は既存FKの `on delete set null` に任せる設計。
- スキーマ、RLS、Storage policy の変更はなし。TKT上の `supabase_schema_change` はテーブル名差分に反応した過剰検出で、実schema変更はない。
- `DeleteConfirmPanel` の追加propsは任意で、既存呼び出しの削除確認文言・danger見た目は維持。
- `app.html`、GAS、Spreadsheet、Drive は未変更。

## test_review

- `computeRollbackQuantityUpdates` は合算、null除外、削除済み在庫の missing 扱いを単体テスト済み。
- `RecipeMealWorkspace` は完了解除、完了済み削除、未完了削除の主要経路をコンポーネントテスト済み。
- `verify.json` は `status: pass`。lint / typecheck / test / build / policy が pass。

## open_risks

- 在庫復元の途中で一部 update 後に失敗した場合、DBトランザクションではないため部分復元が残る可能性がある。現状はエラー表示で再読込と状態確認を促す。
- 完了後に別画面で在庫を手動編集してから完了を外すと、現在値に `consumed_amount` を足し戻す。これはイベント根拠の巻き戻し仕様。
- 実Supabaseデータを使った破壊的手動 smoke は未実施。実データ保護のため、必要時はテスト用献立・在庫・履歴で確認する。

## verdict

実装レビューは通過。破壊的な実DB手動確認だけ未実施のため、運用上はテストデータでの最終確認を推奨する。
