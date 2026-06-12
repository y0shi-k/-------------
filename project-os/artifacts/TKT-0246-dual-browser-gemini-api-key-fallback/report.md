---
ticket_id: TKT-0246-dual-browser-gemini-api-key-fallback
status: ready
---

# TKT-0246 実装報告

## 変更目的

Gemini APIキーを無料用・有料用の2本に分け、通常は無料用を使い、無料APIエラー時だけユーザー選択で有料用キーへ切り替えられるようにした。

## 今回追加した安全装置

- 旧キー `stock-master:user-gemini-api-key` は無料用として読み込む後方互換を維持。
- 無料用キー未入力時はAI実行前に止め、有料用へ自動切替しない。
- 無料APIエラー後だけ3択UIを表示し、有料用キーは「有料APIで続行」を押した場合だけ使う。
- 食材写真解析の再実行では保存済み `photoIds` を使い、写真アップロードを繰り返さない。
- サーバーAPI routeには無料/有料の概念を入れず、受け取った1本の `geminiApiKey` だけを使う。
- APIキー値は画面文言、成果物、verify結果に出していない。

## 実施した確認

- `npm test -- --run src/__tests__/user-gemini-api-key.test.ts src/__tests__/settings-panel.test.tsx src/__tests__/recipe-meal-workspace.test.tsx src/__tests__/inventory-board.test.tsx src/__tests__/web-mode-shell.test.tsx`: pass
- `npm run typecheck`: pass
- `npm run lint`: pass（既存warningのみ）
- `harness/bin/verify_web.sh TKT-0246-dual-browser-gemini-api-key-fallback`: pass
- ブラウザ確認: `http://localhost:3100` が `/login` へ遷移し、スマホ幅390pxで横スクロールなし。

## 残リスク

- 実Gemini APIキーでのライブ実行は、実キー送信と課金回避のため未実施。
- ブラウザ保存のため、共有端末やXSSがあるとAPIキー流出リスクは残る。
- 既存テストで React key 警告が出ている箇所があるが、今回変更したGeminiキー処理とは別件。

## 次の依頼や人判断

- 実機・実アカウントで確認する場合は、無料用/有料用キーを設定画面に入れ、無料キー失敗時の3択と有料続行を目視確認する。
- 有料キーは料金が発生しうるため、実行前にGoogle側の課金設定と利用上限を確認する。
