# TKT-0180 実装報告

## 実装内容

- レシピ画像登録・差し替えUIに「過去の完成写真から選ぶ」導線を追加した。
- 調理完了モーダルの料理写真欄にも「過去の完成写真から選ぶ」導線を追加した。
- `photos` テーブルから本人の `usage_type='cooking_history'` 写真だけを新しい順で取得するフックを追加した。
- 候補写真をサムネグリッドで表示する共通ピッカーを追加した。
- 候補を選んだときは元Storage objectを共有せず、新しいStorage pathへコピーしてから設定先へ保存するようにした。
- `Storage.copy` が使えない場合に備え、`download` から再 `upload` するフォールバックを追加した。
- 候補0件や読み込み中でもUIが崩れないCSSを追加した。
- 候補取得とコピー経路の単体テストを追加した。

## 検証

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: pass（31 files / 209 tests）
- `npm run build`: pass
- `harness/bin/verify_web.sh TKT-0180-cooking-photo-candidate-reuse`: pass
- Browser確認: レシピ画像側・料理写真側の候補ピッカー表示、候補サムネ表示、スマホ幅390pxで横はみ出しなし。

## セキュリティ

- 候補取得は必ず `user_id` と `usage_type` で絞り込む。
- 公開URLや署名付きURLはDBに保存しない。
- Service Role keyはブラウザで使わない。
- DBに保存するのはStorage pathのみ。
- 候補からの設定はコピー後pathを保存し、元写真削除による参照切れを避ける。

## 注意

- 実Storageコピーを伴う保存操作は副作用を避けるため手動実行していない。
- 候補写真の自動削除・容量管理は将来課題。
