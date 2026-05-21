---
ticket_id: TKT-0076-ai-processing-cancel
status: completed_static_verify
---

# Report

AI待ちの共通 overlay にAI専用のキャンセルボタンを追加し、Gemini API の直接 `fetch` を `AbortController` で中断できるようにした。

## 変更内容

- `processingOverlay` に `aiCancelButton` を追加。
- `state.activeAiAbortController`, `state.activeAiRequestId`, `state.activeAiOperationLabel` を追加。
- `setStatus(show, label, options)` を後方互換のまま拡張し、AI時だけキャンセルボタンを表示。
- `beginAiRequest`, `endAiRequest`, `cancelActiveAiRequest`, stale request 判定を追加。
- 対象AI処理:
  - `consultAiRecipe`
  - `generateAiRecipeFromPlan`
  - `batchPredictAI`
  - `parseRecipeTextWithAI`
  - `scanImageWithAI`
- `batchCompleteFlow` はAI解析キャンセル時に在庫登録へ進まないよう変更。

## Verify

- Standard verify: passed
- JS parse: passed
- Native dialog check: no matches
- `executeGAS(payload...)`: 既存の sync/init/load 系のみ

## Manual

Canvas実表示でのキャンセル操作 smoke はユーザー確認待ち。
