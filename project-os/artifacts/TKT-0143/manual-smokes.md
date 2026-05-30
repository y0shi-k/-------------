---
ticket_id: TKT-0143-recipe-schedule-canvas-picker-parity
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

> 補足: 本変更はUI改修であり、Supabase schema / migration / RLS / auth / Storage は変更していない。
> check-gates が diff 内の文字列 `meal_schedules`（既存の `supabase.from("meal_schedules")` 呼び出し、変更なし）に反応して
> `supabase_schema_change` を保守的にマッチしたため、データ保護面の不変を静的確認として記録する。

## target_evals

- supabase_schema_change（保守的マッチ。実体はスキーマ変更なしのUI改修）

## executed_checks

- web_auth_guard（認証ガード）: 変更ファイルにログイン/認可・middlewareの変更が無いことを確認。`recipe-meal-workspace.tsx` はクライアントの表示・操作のみで、Supabase呼び出しは従来同様 `user_id` を付与（`addScheduleEntry` で `user_id: userId` をinsert）。認証ガードの経路は不変。
- web_storage_security（写真Storage権限）: 変更に Supabase Storage / バケット / 署名URL / 画像アップロードへの変更が無いことを確認。スケジュールUI・買い物UIは写真Storageに触れない。
- DB書き込みの不変性: 献立追加は `meal_schedules` へ従来と同じ列（`user_id` / `scheduled_on` / `meal_type` / `recipe_id` / `recipe_name` / `status`）でinsert。`moveSchedule` / `deleteSchedule` / `completeSchedule` のクエリは変更なし。
- 買い物の食材管理タブへの移設: `shopping_items` への insert/update/delete はすべて `user_id` 付きで従来と同一の列・条件。`InventoryBoard` 側に同等ロジックを実装しただけで、スキーマ・RLS・policyは不変。
- 自動テスト: `npm run test` で献立の追加（ピッカー経由）・翌日移動・削除の経路が成功（53/53）。
- verify: lint / typecheck / test / build すべてpass、policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）すべてpass（verify.json）。

## skipped_checks

- 実機ブラウザでのログイン後手動操作: ローカル/CI環境に本番相当の認証セッションと献立データが無いため静的確認に留めた。コンポーネント単体テストが新UI（7日献立ボード・ピッカーdialog・移動/削除）を直接レンダリングして代替検証している。
- RLS policyの実DB往復確認: スキーマ/policyを変更していないため、本チケットでは実行不要と判断（既存policyは不変）。

## open_risks

- 実機（ログイン済み・本番相当データ）での見た目の最終目視は未実施。データ保護面の挙動には影響しないが、レイアウト確認として推奨。
