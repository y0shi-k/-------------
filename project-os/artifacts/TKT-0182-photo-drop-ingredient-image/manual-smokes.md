---
ticket_id: TKT-0182-photo-drop-ingredient-image
status: passed
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- 在庫編集の食材画像エリアへの画像ファイルドラッグ&ドロップ
- 既存のクリック/タップ画像選択の維持
- スマホ幅で食材画像エリアがモーダル内に収まること
- Storage/schema/auth/RLSを変更していないことの確認

## executed_checks

- `inventory-board.test.tsx` に、食材画像エリアへ複数画像をドロップしたとき先頭1件がプレビューされるテストを追加し、成功しました。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` を含むWeb版verifyが成功しました。
- `http://localhost:3000` をアプリ内ブラウザで開き、PC幅で在庫編集の食材画像エリアが表示されることを確認しました。
- PC幅で `画像を選ぶ`、`accept="image/*"`、`capture="environment"` が維持されていることを確認しました。
- スマホ幅390pxで食材画像エリアがモーダル内に収まり、横はみ出しがないことを確認しました。
- 差分確認で、Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認しました。
- Canvas版 `app.html` を編集していないことを確認しました。

## skipped_checks

- 実ファイルをPCブラウザから直接ドラッグする手動操作は未実施です。今回の変更はStorage設定変更ではなく、既存の食材画像選択フローへFileを渡すUI入力追加のため、自動テストと画面確認で代替しました。
- スマホ実機確認は未実施です。スマホ向けには既存の `<input type="file">` と `capture="environment"` を温存しており、ドラッグ&ドロップ自体はPC操作向けです。

## open_risks

- PCブラウザ上での実ファイルドラッグ操作は、ユーザー環境で最終確認してください。
- `photo_upload_storage` は語彙マッチにより発火していますが、実Storage設定やアップロード処理は変更していません。
