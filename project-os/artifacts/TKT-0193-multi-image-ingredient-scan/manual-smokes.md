---
ticket_id: TKT-0193-multi-image-ingredient-scan
status: passed
execution_mode: automated_and_static
target_evals:
  - ai_server_route
  - photo_upload_storage
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- `ai_server_route`: `POST /api/ai/scan-ingredients` の単体/複数 `photoId(s)`、一部失敗、全失敗、上限超過を確認。
- `photo_upload_storage`: フロントの複数画像選択、画像ごとのStorage保存、DB photo行作成、失敗時の成功分継続を確認。
- `auth_and_rls_policy`: 本人の `photos` 行だけを `.eq("user_id", user.id)` で取得し、Storage pathや署名URLを画面表示しないことを確認。

## executed_checks

- `npm test -- ingredient-scan scan-ingredients-route inventory-board`: pass
- `harness/bin/verify_web.sh TKT-0193-multi-image-ingredient-scan`: pass
- 静的確認: `web/src/components/inventory-board.tsx` の写真inputに `multiple` があり、送信bodyは `{ photoIds, geminiApiKey }`。
- 静的確認: `web/src/app/api/ai/scan-ingredients/route.ts` は `photoId` と `photoIds` の両方を受け、各写真で `consumeAiUsage` を呼ぶ。
- 静的確認: 写真取得は `photos.id` / `photos.user_id` / `usage_type = ingredient_scan` で絞り込む。
- 静的確認: APIキー、Service Role Key、公開写真URLの直書きなし。verify policy `no_hardcoded_secret` / `supabase_rls_present` は pass。

## skipped_checks

- 実機スマホでのカメラ複数選択は未実施。ブラウザ操作はローカルタブ遷移がタイムアウトしたため、実データ送信を伴う手動確認は行っていない。
- 実Supabase Storageへのアップロードは未実施。自動テストのモックでStorage upload/removeとDB insertの呼び出しを確認した。

## open_risks

- iOS/AndroidのカメラUIは `multiple` と `capture` の扱いが端末差あり。端末によってはギャラリー複数選択はできても、カメラ撮影は1枚ずつになる可能性がある。
- 一部失敗時の表示は件数ベース。どの写真が失敗したかの個別表示は未実装。
