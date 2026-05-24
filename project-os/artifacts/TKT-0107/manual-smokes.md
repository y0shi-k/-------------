# TKT-0107 Manual Smokes

Status: done

## Checked

- [x] 写真選択後、ボタン表示が `AI解析する` になる。
- [x] 写真保存後、`POST /api/ai/scan-ingredients` へ `photoId` を送る。
- [x] API成功時、AI候補が登録待ち一覧へ追加される。
- [x] API失敗時、画面に `原因 / 影響 / 修正方法` 形式のエラーが出る。
- [x] 未ログイン時、APIは401で止まる。
- [x] `GEMINI_API_KEY` 未設定時、APIは安全な500で止まる。
- [x] 本人の `ingredient_scan` 写真メタデータだけを解析対象にする。
- [x] 写真は非公開Storageから読み出し、公開URLは作らない。

## Notes

- 実Gemini通信は、秘密キーを含むため自動テストではモック確認に留めた。
- 実機では `web/.env.local` またはVercel環境変数に `GEMINI_API_KEY` を設定してから、スマホでレシートまたは食材パッケージを撮影して確認する。
- APIキー実値はコード、Markdown、チャットに記録しない。
