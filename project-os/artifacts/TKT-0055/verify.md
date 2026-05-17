# Verify

## 自動チェック

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# => VERIFY_PASSED
```

## Canvas 環境追加チェック

- `alert(` / `confirm(` / `prompt(` 残存なし ✅
- `showToast` 関数存在 ✅
- `GEMINI_API_KEY` 空チェックバリデーションなし（既存のまま）✅
- スプシ書き込み系の新規個別 `executeGAS` 呼び出しなし ✅
- 新規コードが既存パターンを再利用（if/else のみ追加）✅

## 変更箇所 grep 確認

```bash
$ grep -n "APIの利用制限に達した可能性があります" app.html
# => 5 箇所にマッチ（parseRecipeTextWithAI / consultAiRecipe / generateAiRecipeFromPlan / scanImageWithAI / batchPredictAI）
```

```bash
$ grep -n "!res.ok" app.html
# => batchPredictAI に新規追加された !res.ok チェックが含まれる
```

## 差分要約

- `app.html`: 5 箇所の `catch` ブロックに `err.message.includes('401')` 判定を追加
- `app.html`: `batchPredictAI` に `!res.ok` チェックを追加（他の Gemini API 関数と同一パターン）
