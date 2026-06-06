---
ticket_id: TKT-0181-photo-drop-foundation-recipe-image
status: passed
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- レシピ画像エリアへの画像ファイルドラッグ&ドロップ
- 既存のクリック/タップ画像選択の維持
- 献立カードのドラッグ移動との分離
- Storage/schema/auth/RLSを変更していないことの確認

## executed_checks

- `extractImageFilesFromDataTransfer` の単体テストで、Filesなし、非画像のみ、画像1件、画像複数、画像と非画像混在を確認しました。
- `recipe-meal-workspace` の既存テストで、献立カードのドラッグ移動が引き続き成功することを確認しました。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` を含むWeb版verifyが成功しました。
- 差分確認で、Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認しました。
- Canvas版 `app.html` を編集していないことを確認しました。

## skipped_checks

- ログイン済み実ブラウザでの画像ドロップ操作は未実施です。今回の変更はStorage設定変更ではなく、既存の画像選択フローへFileを渡すUI入力追加のため、静的確認と自動テストで代替しました。
- スマホ実機確認は未実施です。スマホ向けには既存の `<input type="file">` を温存しており、ドラッグ&ドロップ自体はPC操作向けです。

## open_risks

- PCブラウザ上での実ファイルドラッグ操作は、ユーザー環境で最終確認してください。
- `photo_upload_storage` は語彙マッチにより発火していますが、実Storage設定やアップロード処理は変更していません。
