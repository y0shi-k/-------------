---
ticket_id: TKT-0246-dual-browser-gemini-api-key-fallback
status: passed
review_scope:
  - web/src/lib/ai/user-gemini-api-key.ts
  - web/src/components/gemini-api-key-panel.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
---

# TKT-0246 Review

## checked_diff_paths

- `web/src/lib/ai/user-gemini-api-key.ts`
- `web/src/components/gemini-api-key-panel.tsx`
- `web/src/components/settings-panel.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/components/inventory-board.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/user-gemini-api-key.test.ts`
- `web/src/__tests__/settings-panel.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/web-mode-shell.test.tsx`

## checked_artifacts

- `project-os/artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/verify.json`
- `project-os/artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/manual-smokes.md`
- `project-os/artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/report.md`

## findings

- 重大な指摘なし。
- APIキー保存は無料用・有料用を別キーで管理し、旧キーは無料用として読み込む。無料用削除時は旧キーも削除する。
- 有料キー切替は無料キー失敗時の3択UI経由のみで、自動切替は入っていない。
- `/api/ai/recipes` と `/api/ai/scan-ingredients` のサーバー契約は、リクエストの `geminiApiKey` 1本を `x-goog-api-key` に使う形を維持している。
- 写真解析は無料キー失敗後の再実行で保存済み `photoIds` を保持し、写真アップロードを繰り返さない。
- 既存の route 側 `consumeAiUsage` / `refundAiUsage` の流れは変更していない。

## open_risks

- ブラウザ保存のため、共有端末やXSSがあるとAPIキー流出リスクは残る。
- 実Gemini APIでのライブ確認はしていない。課金回避のため、モックテストでキー選択と再実行契約を確認した。
- 既存テストで React key 警告が出ている箇所があるが、今回変更したGeminiキー処理とは別件。

## verdict

pass
