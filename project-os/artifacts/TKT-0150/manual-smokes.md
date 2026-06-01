---
ticket_id: TKT-0150
status: passed
execution_mode: automated_and_static
target_evals:
  - ai_server_route
  - pwa_mobile_ui
---

# Manual Smokes

## target_evals

- `ai_server_route`: AIレシピ生成と食材写真解析のAPI routeが、ユーザー入力のGemini APIキーを受け取り、Gemini呼び出しの `x-goog-api-key` にだけ使うこと。
- `pwa_mobile_ui`: レシピAIと写真解析の近くに、スマホでも操作できるAPIキー入力・保存・削除UIがあること。

## executed_checks

- `npm test -- --run src/__tests__/recipes-route.test.ts src/__tests__/scan-ingredients-route.test.ts src/__tests__/recipe-meal-workspace.test.tsx src/__tests__/inventory-board.test.tsx`
  - 43件成功。
  - APIキー未入力時に通信・写真アップロードを止めることを確認。
  - ユーザーキーがAPI routeへ渡り、Gemini fetchの `x-goog-api-key` に入ることを確認。
  - レスポンスJSONにダミーキーが含まれないことを確認。
- `harness/bin/verify_web.sh TKT-0150`
  - `lint` / `typecheck` / `test` / `build` / policy checks がすべて `pass`。
- 静的確認
  - `web/src/components/gemini-api-key-panel.tsx` は `type="password"`、保存・削除ボタン、DB非保存の注意文を持つ。
  - `web/src/app/api/ai/recipes/route.ts` と `web/src/app/api/ai/scan-ingredients/route.ts` は `process.env.GEMINI_API_KEY` fallbackを使わない。
  - `rg` で出荷コードに実キー直書きがないことを確認。テスト内の値は `user-owned-test-key` のみ。

## skipped_checks

- in-app Browserで `http://localhost:3000` を開く確認は、ブラウザセキュリティポリシーにより拒否されたため未実施。
- 実Gemini APIキーを使ったライブ生成・ライブ写真解析は未実施。実キー送信と課金が発生する可能性があるため、このセッションでは行わない。

## open_risks

- `localStorage` 保存は共有端末やXSSがある場合にAPIキー流出リスクがある。UI上で削除ボタンと注意文は用意したが、公開前に利用者向け説明を追加するとより安全。
- ブラウザ実機でのスマホ表示は未確認。自動テストとCSS確認では破綻は見つかっていない。
