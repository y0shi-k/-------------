---
ticket_id: TKT-0036-ai-json-response-hardening
status: ready
---

# Report

## 変更目的

Gemini応答にJSON本体以外の文字が混ざった場合に、AIレシピ構造化などが `JSON.parse()` で失敗する問題を防ぐ。

## 今回追加した安全装置

- `parseAIJsonResponse()` を追加し、通常JSON、Markdownコードフェンス、最初の完全なJSONブロックの順に解析するようにした。
- `extractFirstJsonBlock()` を追加し、文字列内の括弧を誤検出しない形でJSON本体を抽出するようにした。
- レシピ考案、期限予測、テキストからレシピ追加、画像スキャンのJSON解析を共通パーサーへ統一した。

## 実施した確認

- 既存verify: `VERIFY_PASSED`
- 直接AI応答を `JSON.parse(raw/text/data.candidates...)` する箇所が残っていないことを静的確認。
- 末尾説明文、Markdownコードフェンス、JSON文字列内の括弧を含む代表ケースをNodeで確認。

## 残リスク

- 実Gemini API通信はCanvas上のAPIキー入り環境で追加確認が必要。
