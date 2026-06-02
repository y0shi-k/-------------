---
ticket_id: TKT-0152-cooking-history-record-edit
status: passed
execution_mode: static_and_partial_browser
target_evals:
  - web_project_bootstrap
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

## target_evals

- `web_project_bootstrap`: Web版のlint/typecheck/test/buildと未ログイン保護を確認。
- `photo_upload_storage`: 写真追加/削除コード、Storage remove/upload、`photos` テーブル更新の実装を静的確認。
- `supabase_schema_change`: 新規マイグレーションなし。既存RLS/policyをverifyで確認。

## executed_checks

- `harness/bin/verify_web.sh TKT-0152-cooking-history-record-edit` を実行し、`lint` / `typecheck` / `test` / `build` / policyチェックがすべて `pass`。
- 追加テスト `web/src/__tests__/cooking-history-edit.test.ts` で、消費量増減、在庫付け替え、行削除、0クランプ、在庫消失時の挙動を確認。
- 追加テスト `web/src/__tests__/cooking-history-board.test.tsx` で、`recipe_id` の有無に関わらず編集ボタンが表示され、編集モーダルが開くことを確認。
- 開発サーバー `http://localhost:3002` をBrowserで開き、未ログイン状態ではログイン画面が表示されることを確認。
- `supabase/migrations/20260523094705_schema_v1.sql` と `supabase/migrations/20260524193000_cooking_consumption_events.sql` で、対象テーブルのRLS/policyが既存定義として存在することを確認。

## skipped_checks

- 実DB上での写真追加・削除、Storage実体削除、在庫数量の増減確認は未実施。理由: このセッションで安全に使えるログイン済みテストデータ作成手順がリポジトリ内に見つからず、本番データを触るリスクがあるため。
- スマホ実機のカメラ起動確認は未実施。理由: ローカル自動テスト環境では実機カメラを扱えないため。

## open_risks

- Supabaseクライアントから複数テーブルを順に更新するため、途中失敗で在庫だけ更新済みになる可能性がある。エラーメッセージには「原因」「影響」「修正方法」を出すが、完全な一括更新が必要なら別チケットでRPC化する。
- 写真Storageの実操作は未スモークのため、実環境のStorage policyやファイルサイズ条件で失敗する可能性が残る。
- 在庫が0付近のときは、既存作成フローと同じく0で止めるため、厳密な巻き戻しにならないケースがある。
