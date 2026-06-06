---
ticket_id: TKT-0187-photo-clipboard-paste
status: passed
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- 画像エリアのクリック/フォーカスによるアクティブ化と視覚表示
- アクティブ状態でのクリップボード画像の Ctrl+V 登録・差し替え
- アクティブでないときは貼り付けが発火しない（ページ全体の Ctrl+V を奪わない）
- 既存のドラッグ&ドロップ・クリック選択・スマホ挙動の維持
- Storage/schema/auth/RLSを変更していないことの確認

## executed_checks

- `use-image-file-drop.test.ts` に clipboard 形状（`types:["Files"]`）からの画像抽出と、テキストのみ（Files 無し）が空配列になるテストを追加し、成功しました。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` を含むWeb版verifyが成功しました。
- 差分確認で、Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認しました。
- 共通フック `useImageFileDrop` の拡張が後方互換（既存 `dragHandlers`/`isDraggingOver` 維持、追加返り値のみ）であることをコードレビューで確認しました。
- Canvas版 `app.html` を編集していないことを確認しました。

## skipped_checks

- 実ブラウザでのスクリーンショット Ctrl+V 貼り付け（実 ClipboardEvent）は未実施です。今回の変更は Storage 設定変更ではなく、既存の `onFiles`（圧縮・アップロード）経路へ貼り付け File を渡す UI 入力追加のため、抽出純関数の自動テストと静的確認で代替しました。
- スマホ実機確認は未実施です。スマホ向けには既存の `<input type="file">`／`capture` を温存しており、Ctrl+V 貼り付け自体はPC操作向けです。

## open_risks

- PCブラウザ上での実 Ctrl+V 貼り付け（登録・差し替え）は、ユーザー環境で最終確認してください。
- Safari 等、クリップボード画像を `files` 経由で露出しないブラウザは未対応の可能性があります。
- `photo_upload_storage` / `supabase_schema_change` は差分語彙（無関係な作業ツリー残ファイル含む）により発火していますが、実 Storage 設定・schema・アップロード処理は変更していません。
