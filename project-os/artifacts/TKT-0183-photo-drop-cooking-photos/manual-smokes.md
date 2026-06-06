---
ticket_id: TKT-0183-photo-drop-cooking-photos
status: passed
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- 料理記録の編集モーダルの完成写真エリアへの画像ファイルドラッグ&ドロップ（複数対応）
- 調理完了フローの料理記録パネルの完成写真エリアへのドラッグ&ドロップ（単一）
- 既存のクリック/タップ画像選択の維持
- 献立カード移動ドラッグと混同しないこと
- Storage/schema/auth/RLSを変更していないことの確認

## executed_checks

- `cooking-record-edit-modal.test.tsx` を新規追加し、(1) 複数画像ドロップで全件が追加候補に並ぶ、(2) 非画像ドロップは追加されない、(3) Ctrl+V 貼り付けで画像が追加候補に並ぶ、(4) クリックでアクティブ化し案内が更新される、(5) ドラッグ中ハイライトが付き解除される、を検証して成功しました（5件）。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` を含むWeb版verifyが成功しました。
- 差分確認で、両コンポーネントとも既存の `compressImageFile` →`photos` 登録経路を再利用しており、Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認しました。
- 共通フック `useImageFileDrop` の `types.includes("Files")` 判定により、献立カード移動の `text/plain` ドラッグと区別されることをコードで確認しました。
- Canvas版 `app.html` を編集していないことを確認しました。

## skipped_checks

- 実ファイルをPCブラウザから直接ドラッグする手動操作は未実施です。今回の変更はStorage設定変更ではなく、既存の完成写真選択フローへFileを渡すUI入力追加のため、自動テストと差分確認で代替しました。
- `recipe-meal-workspace.tsx` 側の料理記録パネルへのドロップは、消費量確認モーダルを経由する深いフローのため、自動テストではモーダル側（`cooking-record-edit-modal.tsx`）の入口確認で代替しました。配線は同一フック・同一パターンです。
- スマホ実機確認は未実施です。スマホ向けには既存の `<input type="file">` と `capture="environment"` を温存しており、ドラッグ&ドロップ自体はPC操作向けです。

## open_risks

- PCブラウザ上での実ファイルドラッグ操作・実クリップボード Ctrl+V 貼り付け（両エリア）と実機での圧縮・アップロードは、ユーザー環境で最終確認してください。
- `photo_upload_storage` / `supabase_schema_change` は語彙マッチにより発火していますが、実Storage設定・schema・アップロード処理は変更していません。
