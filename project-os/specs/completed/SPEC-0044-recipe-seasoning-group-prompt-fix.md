---
id: SPEC-0044-recipe-seasoning-group-prompt-fix
title: AIプロンプトの「合わせ調味料」認識漏れ修正
status: ready
scope:
  - app.html 内の AI プロンプト（parseRecipeTextWithAI / generateAiRecipeFromPlan）
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - UIコンポーネント追加なし
  - 既存レシピデータに影響なし
acceptance:
  - テキスト解析で「合わせ調味料」セクションの項目が seasonings に含まれる
  - AI考案レシピ生成でも同様に「合わせ調味料」項目が seasonings に含まれる
  - ingredients は主材料のみ、seasonings は調味料+まとまり見出し項目のみと明確に分離される
  - verify が PASS すること
related_tickets:
  - TKT-0044-recipe-seasoning-group-prompt-fix
---

# Summary

TKT-0042（レシピ4区分分離）実装後、実際のレシピテキストを投入したところ「合わせ調味料」セクションの項目が AI によって `seasonings`（調味料）として認識されず、空配列や `ingredients`（材料）への誤分類が発生した。

## 背景

日本語レシピでは調味料が「合わせ調味料」「下味」「たれ」「衣」などの見出しでまとめられることが多い。TKT-0042 のプロンプトでは:
- `ingredients` = 材料（野菜・肉・魚など）
- `seasonings` = 調味料（醤油・塩・砂糖など）

と定義していたが、「合わせ調味料」等の見出しでまとめられた項目を `seasonings` に含めるよう明示的に指示していなかったため、AI が誤認識・スキップしていた。

## 仕様

### プロンプト変更内容

`app.html` 内の2箇所の AI プロンプトを更新:

1. `parseRecipeTextWithAI`（テキストからレシピ構造化）
2. `generateAiRecipeFromPlan` / `consultAiRecipe`（AI考案レシピ生成）

変更前:
```
- ingredients は「材料」（野菜・肉・魚・豆腐・卵など）のみを含む
- seasonings は「調味料」（醤油・塩・砂糖・味噌・酢・酒・コンソメ・だしの素など）のみを含む
```

変更後:
```
- ingredients は主材料（野菜・肉・魚・豆腐・卵・麺・米・パンなど）のみを含む
- seasonings は調味料（醤油・塩・砂糖・味噌・酢・酒・コンソメ・だしの素・オイスターソース・豆板醤・ごま油・味ぽん・鶏がらスープの素など）と、テキスト中で「合わせ調味料」「下味」「たれ」「衣」「薬味」などの見出しでまとめられている項目も含む
- 「合わせ調味料」にまとめられている項目（料理酒・砂糖・オイスターソース・醤油・スープの素など）は必ず seasonings に含める
```

### 非対象

- スプレッドシート列構造
- GAS通信方式
- UIレイアウト
- 既存レシピデータの自動修正
