# Data Safety

## 外部共有しないもの
- `GAS_URL`（WebアプリURL）
- Gemini APIキー（現状 `batchPredictAI` 内で空文字だが、実運用時はGAS側で隠蔽）
- `GEMINI_API_KEY`（Web版ではサーバー側環境変数で管理）
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- Supabase接続情報のうち秘密鍵にあたるもの
- `SS_ID_RECIPE_APP`（Google Spreadsheet ID）
- ユーザーの食材データ・買い物履歴・料理記録
- ユーザーが撮影した写真、写真URL、Storageパス
- 社内機密、個人情報、認証情報、未公開データ

## 実行境界
- GAS Webアプリへのデプロイ・公開設定変更は明示依頼がある場合だけ実行する
- Google Spreadsheet の手動編集（特にスキーマ変更）は絶対に行わない
- Google Drive へのファイルアップロードは明示依頼がある場合だけ実行する
- Gemini APIキーの露出・共有は行わない
- Vercel公開、Supabase本番DB操作、Supabase Storageへの本番アップロードは明示依頼がある場合だけ実行する
- Web版ではGAS、Google Spreadsheet、Google Driveを使わない
- 本番変更、デプロイ、外部公開、課金操作は明示依頼がある場合だけ実行する

## Web版の必須安全ルール
- Supabase RLSを必須にする。RLSは本人のデータだけ読めるようにするDB側の安全設定。
- 写真は個人情報を含む可能性があるため、公開バケットや恒久的な公開URLを使わない。
- Gemini APIはNext.js API Routeなどサーバー側から呼び、ブラウザへAPIキーを渡さない。
- `.env.local` は正本に含めない。共有用には実値なしの `.env.example` だけを置く。

## 破壊的操作
- `rm` `drop` `reset` などの破壊的操作は最後の手段にする
- 削除候補はまず `.trash/` に退避する
- 退避理由が必要なら `docs/` か `project-os/` に残す
