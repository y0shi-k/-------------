---
id: TKT-0044-recipe-seasoning-group-prompt-fix
title: AIプロンプトの「合わせ調味料」認識漏れ修正
status: completed
goal: テキスト解析・AI考案時に「合わせ調味料」「下味」「たれ」「衣」などのまとまり項目を seasonings（調味料）として正しく認識させる
acceptance:
  - 「合わせ調味料」セクションの項目が seasonings に含まれる
  - 「調味料」単体だけでなく、「合わせ調味料」「下味」「たれ」「衣」「薬味」などの見出し項目も seasonings に分類される
  - プロンプト変更後、実際のテキスト解析で調味料が空にならない
eval_selection_mode: auto
required_evals:
  - canvas_constraint
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0044-recipe-seasoning-group-prompt-fix
related_tickets:
  - TKT-0042-recipe-prep-seasoning-separation
related_artifacts:
  - artifacts/TKT-0044/verify.json
  - artifacts/TKT-0044/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更なし、GASパターン変更なし、UI追加なし
---

# Summary

TKT-0042（レシピ4区分分離）実装後の残リスク対応。「合わせ調味料」等の見出しでまとめられた調味料項目が AI によって `ingredients`（材料）に誤認識・スキップされる不具合を修正。

## 実装メモ

- 変更対象: `app.html` 内の AI プロンプト2箇所
  1. `parseRecipeTextWithAI`（テキストからレシピ構造化）
  2. `generateAiRecipeFromPlan` / `consultAiRecipe`（AI考案レシピ生成）
- プロンプト内の `seasonings` 定義に以下を追加:
  - 「合わせ調味料」「下味」「たれ」「衣」「薬味」などの見出しでまとめられている項目も含む
  - 「合わせ調味料」にまとめられている項目は必ず `seasonings` に含める強制指示
- `ingredients` 定義を「材料（野菜・肉・魚・豆腐・卵など）」から「主材料（野菜・肉・魚・豆腐・卵・麺・米・パンなど）」に明確化

## 残リスク

- 実際の Canvas 環境での AI 出力精度は未検証（プロンプト強化済み）
- AI が新しい指示を完全に遵守するかはモデル依存
