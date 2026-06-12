---
ticket_id: TKT-0246-dual-browser-gemini-api-key-fallback
status: passed
target_evals:
  - ai_server_route
  - pwa_mobile_ui
  - photo_upload_storage
---

# TKT-0246 手動確認

## executed_checks

- 設定UIは「無料Gemini APIキー」「有料Gemini APIキー」の2入力になり、それぞれ password input、保存、削除、入力済み/未入力表示を持つことをテストで確認した。
- 旧ブラウザ保存キーは無料用キーとして読み込まれることを単体テストで確認した。
- AIレシピ生成は通常実行で無料用キーを送り、無料APIエラー後に「無料APIで再試行」「有料APIで続行」「キャンセル」が出ることをテストで確認した。
- 「有料APIで続行」を押した場合だけ、有料用キーで同じレシピAI入力を再送することをテストで確認した。
- 食材写真解析は通常実行で無料用キーを送り、無料APIエラー後に保存済み photoIds を使ってAI解析だけを有料用キーで再実行することをテストで確認した。
- 食材写真解析の有料再実行では、写真アップロードが再実行されないことをテストで確認した。
- ブラウザで `http://localhost:3100` を開き、未ログイン状態で `/login` に遷移して表示されることを確認した。
- スマホ幅 390px で `/login` に横スクロールが出ないことを確認した。

## skipped_checks

- 実Gemini APIキーを使ったライブ実行は未実施。理由: 実キー送信と課金発生を避けるため。
- 認証後の実画面での手動クリック確認は未実施。代替として React Testing Library で設定UI、レシピAI再実行、写真解析再実行を確認した。

## open_risks

- ブラウザ保存のため、共有端末やXSSがあるとAPIキー流出リスクは残る。
- APIキー値は成果物、画面文言、エラーメッセージ、verify結果に記載していない。
- Supabase DBへAPIキーを保存する変更は入れていない。
- サーバーAPI routeに無料/有料の保存や判定は追加していない。
