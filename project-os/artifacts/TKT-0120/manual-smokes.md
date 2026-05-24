# TKT-0120 Manual Smokes

AI確認:

- `/api/ai/recipes` を追加し、Gemini APIキーはサーバー側だけで使う。
- AIレシピ案は直接DB保存せず、プレビュー後にフォームへ反映する。
- 必須食材、任意食材、本文/補足を送れる。
- 本文構造化モードを追加した。
- `npm run test` / `typecheck` / `lint` / `build` は通過している。

ユーザー確認が必要:

- `GEMINI_API_KEY` を設定した環境でAIレシピ生成を実行する。
- AIプレビューの内容を確認してから保存できることを確認する。
