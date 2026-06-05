---
id: SPEC-0107-ai-ingredient-scan-api
title: サーバー側AI食材解析API
status: spec_ready
scope:
  - web/
  - Next.js API Route
  - Gemini API
constraints:
  - Gemini APIキーをブラウザへ出さない
  - AI結果を直接在庫確定しない
  - 写真内の不要な個人情報を保存しない
acceptance:
  - サーバー側API経由でGeminiへ画像解析を依頼できる
  - 解析結果は登録待ち候補として返る
  - エラー時に原因が分かる表示になる
  - APIキーがクライアントbundleに含まれない
related_tickets:
  - TKT-0107-ai-ingredient-scan-api
---

# Summary

写真から食材候補を抽出するAI解析をWeb版へ移植する。セキュリティのため、AI通信は必ずサーバー側API経由にする。

## 非対象

- レシピ生成AI
- 料理履歴写真解析
- AI結果の自動確定
