# TKT-0180 レビュー

## 結論

重大な未解決リスクは見つからない。Web版verifyはpass。

## 確認した観点

- Canvas版 `app.html` は編集していない。
- GAS、Google Spreadsheet、Google Drive 依存は追加していない。
- APIキー、Service Role key、公開URL、署名付きURLの直書きなし。
- 候補取得は `photos.user_id = userId` と `usage_type = 'cooking_history'` の両方で絞り込む。
- 候補取得はピッカーを開いた時だけ実行し、通常表示や入力エラー時に不要なDBアクセスをしない。
- 候補表示は非公開 `photos` バケットのStorage pathから署名付きURLを発行し、DBへ公開URLを保存しない。
- レシピ画像設定時は候補Storage objectを新しい `recipe-images/<recipe_id>/...` pathへコピーし、`recipes.image_storage_path` にはコピー後pathだけを保存する。
- 料理写真設定時も候補Storage objectを新しい `cooking-history/...` pathへコピーし、新しい `photos` 行を作る。
- DB更新または `photos` 行作成に失敗した場合は、コピー済みobjectを削除して孤児ファイルを残しにくくしている。
- Storage `copy` が失敗した場合は `download` から再 `upload` するフォールバックを持つ。

## 残リスク

- 候補を再利用するほどStorage容量は増える。自動削除や容量管理は本チケットの非ゴール。
- 実Storageへの保存・削除を伴う手動smokeは副作用を避けるため未実施。コピー経路はmockテストで確認済み。
- 既存テスト中にReactの同一key警告が1件出ている。今回の変更では発生源を触っておらず、テスト結果はpass。
