# Data Safety

## 外部共有しないもの
- `GAS_URL`（WebアプリURL）
- Gemini APIキー（現状 `batchPredictAI` 内で空文字だが、実運用時はGAS側で隠蔽）
- `SS_ID_RECIPE_APP`（Google Spreadsheet ID）
- ユーザーの食材データ・買い物履歴・料理記録
- 社内機密、個人情報、認証情報、未公開データ

## 実行境界
- GAS Webアプリへのデプロイ・公開設定変更は明示依頼がある場合だけ実行する
- Google Spreadsheet の手動編集（特にスキーマ変更）は絶対に行わない
- Google Drive へのファイルアップロードは明示依頼がある場合だけ実行する
- Gemini APIキーの露出・共有は行わない
- 本番変更、デプロイ、外部公開、課金操作は明示依頼がある場合だけ実行する

## 破壊的操作
- `rm` `drop` `reset` などの破壊的操作は最後の手段にする
- 削除候補はまず `.trash/` に退避する
- 退避理由が必要なら `docs/` か `project-os/` に残す
