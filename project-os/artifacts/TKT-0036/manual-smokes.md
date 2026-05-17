---
ticket_id: TKT-0036-ai-json-response-hardening
status: passed
execution_mode: static_only
target_evals:
  - ai_json_parse_regression
  - static_verify
---

# Manual Smokes

## target_evals

- AI JSONレスポンス解析の回復処理
- 既存verify
- Canvas環境追加チェックの静的確認

## executed_checks

- `parseAIJsonResponse()` が応答全体、Markdownコードフェンス、最初の完全なJSONブロックの順に解析することを確認。
- `generateAiRecipeFromPlan()`, `batchPredictAI()`, `parseRecipeTextWithAI()`, `parseAIImageResponse()` が共通パーサーを使うことを確認。
- `alert(` / `confirm(` / `prompt(` の新規追加なし。
- Spreadsheet書き込み・GASペイロード・同期方式の変更なし。
- `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'` が成功。

## skipped_checks

- 実Gemini API通信は未実施。APIキーが空の正本ファイルであり、Canvas上の実環境確認が必要。

## open_risks

- AIがJSONとして不完全な本文を返した場合は従来通りエラー通知になる。
