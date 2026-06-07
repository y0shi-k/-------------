---
ticket_id: TKT-0205-cooking-history-client-signing
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `web_project_bootstrap` 🟢 非危険（Web版土台）。
- `photo_upload_storage` 🔴 `/check-gates` による語彙過剰マッチ。**実Storage無変更**（読み取り側の署名URL解決経路のみ）。
- `supabase_schema_change` 🔴 `/check-gates` による語彙過剰マッチ。**schema/migration/RLS/バケット設定 無変更**。

## executed_checks

> `status: passed` は **execution_mode: static_only**（静的確認＋自動verifyの範囲）で pass の意。
> ブラウザ実機チェックは skipped_checks に列挙したとおり**未実施（要フォロー）**。

- `/verify`（lint / typecheck / test / build）: pass。
- 自動テスト `cooking-history-board.test.tsx` 9件 pass（表示経路 `useCachedSignedUrls` 解決に追従）。
- 静的確認: `home-dashboard.tsx` は料理履歴写真を表示しない / `recipe-meal-workspace.tsx` は履歴写真の
  `signed_url` 直参照なし、を grep・コード確認で判断。

## skipped_checks

> 以下は dev サーバ＋ブラウザ実機での確認が必要。本タスクではコード整合・自動verifyまで完了。**実機未実施（pending）**。

- [ ] カレンダー表示で代表写真（ドット＋画像）が従来どおり表示される。
- [ ] タイムライン表示で写真サムネ・複数写真バッジ件数が従来どおり表示される。
- [ ] インサイト「写真で見る今月」グリッドの件数と画像が従来どおり表示される。
- [ ] 料理記録の閲覧モーダル（読み取り専用ビューア）で複数写真が表示される。
- [ ] 編集モーダル（`cooking-record-edit-modal`）で既存写真が表示される。
- [ ] レシピ完成写真プレビューに回帰がない。
- [ ] 在庫更新等で `router.refresh()` 後、完成写真が再DLされず DevTools Network で `from cache`。
- [ ] 未ログイン / 本人以外のデータが表示されない（表示経路変更の回帰なし）。

## open_risks

- 初回SSR直後は署名URL解決完了まで一瞬フォールバック表示（仕様として許容）。
- 危険eval2件は語彙過剰マッチ。`storage_path` は非公開バケットで署名なしでは取得不可、RLS・公開設定は無変更のため
  Storage セキュリティ面の新規リスクはないと判断。
