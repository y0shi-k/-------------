# Data Safety

## 外部共有しないもの
- `{{SENSITIVE_DATA_RULES}}`
- 社内機密、個人情報、認証情報、未公開データ

## 実行境界
- `{{DEPLOYMENT_BOUNDARY}}`
- 本番変更、デプロイ、外部公開、課金操作は明示依頼がある場合だけ実行する

## 破壊的操作
- `rm` `drop` `reset` などの破壊的操作は最後の手段にする
- 削除候補はまず `.trash/` に退避する
- 退避理由が必要なら `docs/` か `project-os/` に残す
