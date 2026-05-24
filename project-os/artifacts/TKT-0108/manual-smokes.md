---
ticket_id: TKT-0108-cooking-history-photo-web
status: passed
execution_mode: local_server_and_static
target_evals:
  - photo_upload_storage
  - auth_and_rls_policy
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `photo_upload_storage`
- `auth_and_rls_policy`
- `pwa_mobile_ui`

## executed_checks

- `npm run dev` でローカルサーバーを起動した。
- `curl -I http://localhost:3000` で未ログイン時に `/login` へ `307 Temporary Redirect` することを確認した。
- `curl -I http://localhost:3000/login` でログイン画面が `200 OK` になることを確認した。
- 自動テストで、料理履歴の写真なし保存、完成写真の圧縮アップロード、`photos.usage_type = "cooking_history"`、`user_id` 付きinsert、写真保存失敗時の文言を確認した。
- CSSはスマホ1カラム、幅広画面2カラムで料理履歴フォームと一覧が並ぶ指定を確認した。

## skipped_checks

- 実ユーザーでのSupabaseログイン後の写真アップロード実機確認は、この環境では認証済みブラウザセッションがないため未実施。
- iPhone Safari / Android Chromeでのカメラ起動確認は未実施。

## open_risks

- 実機カメラのファイル形式や通信状態による失敗は、ユーザー環境で追加確認が必要。
- 署名付きURLは30分で失効するため、長時間開いた画面では再読み込みが必要。
