---
ticket_id: TKT-0150
status: ready
---

# Report Draft

## 変更目的

運営者の `GEMINI_API_KEY` と利用料に依存せず、ユーザー自身が用意したGemini APIキーでAIレシピ生成と食材写真解析を実行できるようにした。

## 今回追加した安全装置

- Gemini APIキー入力・保存・削除UIを追加。
- 保存先はブラウザの `localStorage` のみ。Supabase DBには保存しない。
- API実行時だけ `geminiApiKey` をAPI routeへ送り、Gemini呼び出しの `x-goog-api-key` にだけ使用。
- APIキー未入力時は、レシピ生成・写真解析ともにユーザー自身のGemini APIキーが必要だと案内。
- 写真解析では、APIキー未入力なら写真アップロード前に停止。
- サーバー環境変数 `GEMINI_API_KEY` fallbackは使わない方針に変更。
- テストでレスポンスにダミーキーが含まれないことを確認。

## 実施した確認

- 対象テスト: 43件成功。
- 全体verify: `harness/bin/verify_web.sh TKT-0150` 成功。
- verify結果: `project-os/artifacts/TKT-0150/verify.json`
- 手動確認記録: `project-os/artifacts/TKT-0150/manual-smokes.md`
- レビュー記録: `project-os/artifacts/TKT-0150/review.md`

## 残リスク

- `localStorage` 保存は共有端末やXSSに弱い。不要になったら削除する案内は入れたが、公開前に利用者向け説明を追加するとより親切。
- 実Gemini APIキーを使うライブ確認は未実施。課金が発生し得るため、実施時はユーザー承認が必要。
- in-app Browserでの `localhost:3000` 視覚確認はセキュリティポリシーで拒否されたため未実施。

## 次の依頼や人判断

- 必要なら、ユーザー向けヘルプに「Gemini APIキーの作成方法」と「共有端末では削除する」案内を追加する。
