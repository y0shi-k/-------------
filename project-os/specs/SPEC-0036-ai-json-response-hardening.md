---
id: SPEC-0036
title: AI JSONレスポンス解析の堅牢化
status: spec_ready
scope:
  - `app.html` のGemini API JSONレスポンス解析
  - レシピ考案、食材期限予測、テキストからレシピ追加、画像スキャン
constraints:
  - Google Spreadsheet のスキーマ・GASペイロード・同期方式は変更しない
  - AIプロンプトやUIフローの挙動は既存仕様を維持する
acceptance:
  - AI応答がJSON本体の前後に説明文やMarkdownコードフェンスを含んでも、最初の完全なJSONオブジェクトまたは配列を解析できる
  - JSONレスポンスを扱うAI機能が共通パーサーを使う
  - 解析不能な応答は既存のエラートースト経路で通知される
  - HTML構文チェックと既存verifyが通る
related_tickets:
  - TKT-0036-ai-json-response-hardening
---

# Summary

Gemini APIの `responseMimeType: application/json` 指定後も、まれにJSON本体の前後へ説明文やコードフェンスが混ざる場合がある。JSON文字列全体を直接 `JSON.parse()` する実装では、末尾に非空白文字があるだけでAI処理全体が失敗する。

## 仕様

- `app.html` にAI JSON応答用の共通パーサーを追加する。
- 共通パーサーは次の順序で解析する。
  - 応答全体を通常のJSONとして解析する。
  - Markdownコードフェンス内のJSONを解析する。
  - 応答内の最初の完全な `{...}` または `[...]` を抽出して解析する。
- 対象AI機能の直接 `JSON.parse()` を共通パーサーへ置き換える。

## 非対象

- Gemini APIモデルの変更
- Google Spreadsheetへの書き込み方式変更
- レシピ・食材データスキーマ変更
