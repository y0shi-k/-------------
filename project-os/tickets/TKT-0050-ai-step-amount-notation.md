---
id: TKT-0050-ai-step-amount-notation
title: AIレシピ工程の材料・調味料分量明記
status: ready
goal: AIが生成・構造化する工程文で、材料や調味料の使用量が分からなくなる問題を防ぐ
acceptance:
  - AI考案レシピ生成の steps / prepSteps に、工程で使う材料・調味料の分量併記ルールがある
  - テキスト解析の steps / prepSteps に、工程で使う材料・調味料の分量併記ルールがある
  - 同じ材料・調味料が複数工程に出る場合も、各工程ごとに分量または「分量不明」を書くルールがある
  - 分量不明時にAIが勝手に按分せず「分量不明」と書くルールがある
required_evals:
  - canvas_constraint
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0050-ai-step-amount-notation.md
  - project-os/tickets/TKT-0050-ai-step-amount-notation.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0050-ai-step-amount-notation
related_artifacts:
  - artifacts/TKT-0050/verify.json
  - artifacts/TKT-0050/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更なし、GASパターン変更なし、UI追加なし
---

# Summary

AIプロンプトのみを更新し、工程文中の材料・調味料名に分量を併記させる。保存形式や表示UIは変更しない。

## 実装メモ

- 変更対象: `app.html`
  1. `parseRecipeTextWithAI`
  2. `generateAiRecipeFromPlan`
- 追加するプロンプトルール:
  - `steps` / `prepSteps` に出る材料・調味料は `名称（分量）` 形式
  - 複数工程に同じ材料・調味料が出る場合も各工程ごとに分量を書く
  - 工程ごとの使用量が不明なら `名称（分量不明）`

## 残リスク

- 実際の Canvas 環境でのAI出力遵守率はモデル依存。
