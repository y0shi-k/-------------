---
ticket_id: TKT-0037-ai-selected-ingredient-required-toggle
status: passed
execution_mode: static_only
target_evals:
  - ui_component_update
  - ai_prompt_regression
  - static_verify
---

# Manual Smokes

## target_evals

- 指定食材選択UIの必須/任意切替
- AIレシピ考案プロンプト生成
- 既存verify

## executed_checks

- 食材選択状態が `Map` で `required` を保持することを静的確認。
- 新規選択時に `{ required: true }` が入ることを確認。
- 選択済みバッジ本体が `toggleAiIngredientRequired()` を呼び、`×` は `event.stopPropagation()` で選択解除だけを行うことを確認。
- `generateSelectedRecipe()` が `_aiRequired` を付けた食材を `openAiRequestModal()` へ渡すことを確認。
- `buildAiPrompt()` が `selected` モードだけ必須食材と任意食材を分け、`priority` モードの文言を維持することを確認。
- 既存verifyが `VERIFY_PASSED`。

## skipped_checks

- Canvas上のクリック操作と実Gemini通信は未実施。

## open_risks

- 実環境ではバッジのタップ領域と `×` の押し分けをスマホ幅で確認する必要がある。
