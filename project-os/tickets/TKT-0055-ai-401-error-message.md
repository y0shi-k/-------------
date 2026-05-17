---
ticket_id: TKT-0055-ai-401-error-message
status: completed
---

# TKT-0055: Gemini API 401 エラー時のメッセージ改善

## 問題

AI機能（テキスト構造化・画像スキャン・レシピ考案・相談・期限解析）を使用中に、Gemini API の一時的なレート制限や認証問題で `401` エラーが返ることがある。

現状、すべての AI 機能で `APIエラー: 401` という技術的なエラーメッセージがユーザーに表示され、原因が分かりにくい。

## 要求

- API から `401` が返された場合、ユーザーに「APIの利用制限に達した可能性があります。しばらくしてから実行してください。」というわかりやすいメッセージを表示する
- 401 以外のエラーは既存のエラーメッセージを維持する

## 変更範囲

`app.html` 内の Gemini API 呼び出し 5 箇所:

1. `parseRecipeTextWithAI()` — テキストからレシピ構造化
2. `consultAiRecipe()` — AI相談
3. `generateAiRecipeFromPlan()` — AIレシピ生成
4. `scanImageWithAI()` — 画像スキャン
5. `batchPredictAI()` — 食材期限AI解析（`!res.ok` チェックが欠落していたため追加）

## 実装方針

各 `catch` ブロックで `err.message.includes('401')` を判定し、含まれる場合のみ専用メッセージを `showToast` で出力する。それ以外は既存メッセージを維持。

`batchPredictAI()` については他の関数と異なり `!res.ok` チェックがなかったため、他の Gemini API 呼び出しと同じ HTTP エラーチェックを追加する。
