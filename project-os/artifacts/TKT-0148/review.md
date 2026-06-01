# TKT-0148 レビュー

## 結論

実装範囲はチケット要件に沿っており、verify は pass。秘密情報の直書きや GAS 混入はない。

## 確認観点

- モーダル表示
  - `.consumption-backdrop` を `z-index: 90` にし、調理ビューアの `z-index: 85` より前面に出る。
- 在庫減算
  - `draft.selected` が true の行だけ減算対象。
  - 在庫不足時は警告を出し、既存仕様どおり `Math.max(0, ...)` で0止まり。
- 料理履歴
  - コメント未入力時は既定文言。
  - 評価未入力時は null。
  - 評価は1〜5の整数のみ許可。
- 写真保存
  - 既存の圧縮処理と保存パス生成を再利用。
  - `photos.insert` 失敗時は Storage 側のアップロード済みファイルを削除。
  - 写真失敗は非致命にして、料理履歴は写真なしで残す。

## 検証

- `harness/bin/verify_web.sh TKT-0148`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: pass（58 tests）
- `npm run build`: pass

## 注意点

- 写真アップロードはStorage権限と実ユーザーセッションに依存するため、実環境での手動確認が必要。
- 在庫減算のトランザクション化は別チケットで扱うべき内容。
