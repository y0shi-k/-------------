---
ticket_id: TKT-0181-photo-drop-foundation-recipe-image
status: ready
---

# TKT-0181 実装報告

## 変更目的

レシピ画像エリアで、PCから画像ファイルを直接ドラッグ&ドロップして登録できる土台を追加しました。
クリック/タップで画像を選ぶ既存操作はそのまま残しています。

## 今回追加した安全装置

- `DataTransfer` の `types` に `Files` がある場合だけファイルドロップとして扱います。
- MIMEタイプが `image/*` のファイルだけを抽出します。非画像ファイルは登録しません。
- ドロップ後も既存の保存フローを使います。つまり、保存時の圧縮、プレビュー、Supabase Storageへの登録処理は増やしていません。
- Storage、DB schema、RLS、auth、バケット設定は変更していません。
- APIキー、Service Role Key、写真URLの直書きは追加していません。
- Canvas版 `app.html` は編集していません。

## 実施した確認

- `npm test -- use-image-file-drop`: pass
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm test -- recipe-meal-workspace`: pass
- `harness/bin/verify_web.sh TKT-0181-photo-drop-foundation-recipe-image`: pass

verify結果は `project-os/artifacts/TKT-0181-photo-drop-foundation-recipe-image/verify.json` に保存済みです。

## 残リスク

- 実ブラウザ上でのPCドラッグ&ドロップ操作は、今回は自動テストではなくコードと既存テストで確認しています。
- `recipe-meal-workspace.test.tsx` 実行中に既存の `schedule-1` key 重複警告が出ます。テストは成功しており、今回の画像ドロップ変更とは別件です。
- `photo_upload_storage` 系の評価は「photo/image/upload」という語に反応する可能性がありますが、実際のStorage設定やアップロード経路は変更していません。

## 次の依頼や人判断

PCブラウザで、レシピ画像エリアへJPEG/PNG/WebPをドロップしてプレビューが出ること、非画像ファイルをドロップしても登録されないことを手動確認してください。
TKT-0182/TKT-0183では、今回追加した `useImageFileDrop` を食材画像エリアと料理完成写真エリアへ横展開できます。
