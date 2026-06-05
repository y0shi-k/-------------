---
id: TKT-0076-ai-processing-cancel
title: AI待ち処理の即時キャンセル
status: completed
goal: AIの回答待ち中にユーザーが処理を即座にキャンセルでき、キャンセル後に結果が画面状態へ反映されないようにする
acceptance:
  - AI待ち overlay でキャンセルボタンが表示される
  - キャンセル押下で AbortController により Gemini fetch が中断される
  - キャンセル後は通常操作が即座に戻り、AI結果は反映されない
  - batchCompleteFlow のAI解析キャンセル後に batchRegisterDB が走らない
required_evals:
  - gas_pattern_change
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0076-ai-processing-cancel
related_artifacts:
  - artifacts/TKT-0076/verify.json
  - artifacts/TKT-0076/manual-smokes.md
  - artifacts/TKT-0076/review.md
  - artifacts/TKT-0076/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - Spreadsheet 書き込み経路、GAS payload、pendingSync は変更しない
---

# Summary

共通 processingOverlay にAI専用キャンセルボタンを追加し、Gemini API 直接 fetch 呼び出しを `AbortController` で中断可能にする。

## 実装メモ

- 対象: `consultAiRecipe`, `generateAiRecipeFromPlan`, `batchPredictAI`, `parseRecipeTextWithAI`, `scanImageWithAI`
- `regenerateAiRecipe` は `generateAiRecipeFromPlan` 経由で対象
- 非AIのローカル画像処理、GAS通信は対象外

## 残リスク

- Gemini側で処理開始済みのリクエストがサーバー内部で停止されることまでは保証しない。
