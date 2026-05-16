---
id: SPEC-0028-cooking-history-base64-photo-preview
title: 料理履歴写真のGAS Base64プレビュー
status: spec_ready
scope:
  - モードC 料理履歴タブの写真表示
  - Drive写真URLからの読み取り専用GAS通信
constraints:
  - 既存スキーマは変更しない
  - Driveファイルの共有設定は変更しない
  - スプレッドシートへの追加・更新・削除は行わない
  - 書き込み系処理は既存通り `state.pendingSync` + `syncPendingChanges()` に限定する
acceptance:
  - Drive閲覧URLが `<img>` で直接表示できない場合でも、GASが画像BlobをBase64化して返し、料理履歴カードに表示できる
  - Base64取得は読み取り専用で、SpreadsheetやDriveファイルの書き込み・共有設定変更を行わない
  - 取得済み画像はフロントのメモリキャッシュを使い、同じ画面表示で繰り返しGAS取得しない
  - Base64取得に失敗した写真は既存の「写真を開く」リンクを残す
  - 新しいスプレッドシート書き込み通信を追加しない
related_tickets:
  - TKT-0028-cooking-history-base64-photo-preview
---

# Summary

Driveの `file.getUrl()` は閲覧ページURLであり、Canvas内の `<img src>` では画像として表示できない。料理履歴タブでは、MaginAgent型の既存GAS実行経路を使ってDrive画像をBase64化して返し、ブラウザ側では `data:image/...;base64,...` として表示する。

## 背景

TKT-0027 では写真URLを `<img>` に入れて表示を試し、失敗時にリンクへフォールバックした。しかしDrive閲覧URLは画像バイナリURLではないため、リンクは開けてもサムネイルは表示されない。

## 仕様

- 料理履歴カード描画時、写真URLからDrive fileIdを抽出する
- 抽出できた fileId について、未キャッシュ分だけGASへ読み取り専用リクエストを送る
- GAS側は `DriveApp.getFileById(fileId).getBlob()` で画像Blobを読み、`Utilities.base64Encode(blob.getBytes())` で返す
- フロント側は `data:{mimeType};base64,{base64}` を `state.cookingHistoryImageCache` に保存して表示する
- URLがBase64 data URLの場合は、そのまま表示する
- fileId抽出やBase64取得に失敗した場合は既存リンクフォールバックを維持する

## 非対象

- 画像の公開共有化
- Drive API高度サービスの追加
- `料理履歴` シートへの列追加
- サムネイル画像の永続保存
