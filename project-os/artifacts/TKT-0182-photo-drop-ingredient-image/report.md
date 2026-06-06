---
ticket_id: TKT-0182-photo-drop-ingredient-image
status: ready
---

# TKT-0182 実装報告

## 変更目的

在庫編集の食材画像エリアで、PCから画像ファイルを直接ドラッグ&ドロップして登録できるようにしました。
クリック/タップで「画像を選ぶ」既存操作はそのまま残しています。

## 今回追加した安全装置

- TKT-0181 の共通フック `useImageFileDrop` を再利用し、`Files` のドラッグだけを画像ドロップとして扱います。
- MIMEタイプが `image/*` のファイルだけを受け付けます。非画像ファイルは登録しません。
- 複数画像がドロップされた場合は先頭1件だけを使います。
- ドロップ後は既存の食材画像選択処理へ渡すため、圧縮、プレビュー、Supabase Storageへの保存経路は従来と同じです。
- Storage、DB schema、RLS、auth、バケット設定は変更していません。
- APIキー、Service Role Key、写真URLの直書きは追加していません。
- Canvas版 `app.html` は編集していません。

## 実施した確認

- `npm run test -- inventory-board.test.tsx`: pass
- `harness/bin/verify_web.sh TKT-0182-photo-drop-ingredient-image`: pass
- `http://localhost:3000` の画面確認: pass
  - PC幅で在庫編集の食材画像エリアが表示され、`画像を選ぶ`、`accept="image/*"`、`capture="environment"` が維持されていることを確認しました。
  - スマホ幅390pxで食材画像エリアがモーダル内に収まり、横はみ出しがないことを確認しました。

verify結果は `project-os/artifacts/TKT-0182-photo-drop-ingredient-image/verify.json` に保存済みです。

## 残リスク

- 実ファイルを使ったPCドラッグ&ドロップ操作は、自動テストで入口を確認済みです。実機でのファイルドロップは最終の手動確認ポイントとして残ります。
- 全体テスト中に既存の `schedule-1` key 重複警告が出ています。テストは成功しており、今回の食材画像ドロップ変更とは別件です。
- `photo_upload_storage` 系の評価は「image」「upload」という語に反応する可能性がありますが、実際のStorage設定やアップロード経路は変更していません。

## 次の依頼や人判断

PCブラウザで在庫編集の食材画像エリアへJPEG/PNG/WebPをドロップし、プレビューが表示されることを確認してください。
スマホでは従来どおり「画像を選ぶ」から写真選択してください。
