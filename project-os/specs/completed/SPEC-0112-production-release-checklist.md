---
id: SPEC-0112-production-release-checklist
title: 本番公開前チェック
status: spec_ready
scope:
  - Vercel公開前確認
  - Supabase本番確認
  - セキュリティ確認
constraints:
  - 明示依頼なしに本番公開しない
  - 明示依頼なしに本番DBへ書き込まない
  - 秘密情報を成果物に残さない
  - 完全一致チケット群、CSV移行、PWA仕上げが終わるまで開始しない
acceptance:
  - 環境変数の不足がない
  - RLSとStorage非公開が確認されている
  - Web版buildが通っている
  - スマホ実機確認項目が整理されている
related_tickets:
  - TKT-0112-production-release-checklist
---

# Summary

Web版を本番公開する前の最終チェックを定義する。Canvas完全一致、CSV移行、PWA仕上げが終わってから行い、公開作業そのものはユーザーの明示依頼がある場合だけ実行する。

## 非対象

- 無断デプロイ
- 無断本番DB操作
- 新規機能追加
