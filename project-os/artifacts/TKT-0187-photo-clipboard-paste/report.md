---
ticket_id: TKT-0187-photo-clipboard-paste
status: ready
---

# TKT-0187 実装報告

## 変更目的

レシピ画像エリア（recipe-meal-workspace.tsx）と食材画像エリア（inventory-board.tsx）を
クリック/フォーカスでアクティブ化し、その状態であることを視覚的に分かるようにしました。
アクティブ状態のときだけ、クリップボードの画像を Ctrl+V で登録・差し替えできます。
ページ全体の Ctrl+V は奪わず、画像エリアがアクティブな間に限定しています（方式A: フォーカススコープ）。

## 今回追加した安全装置

- TKT-0181 の共通フック `useImageFileDrop` を拡張し、`onPaste` と `onFocus`/`onBlur` を追加しました。既存の `dragHandlers`/`isDraggingOver` は据え置きで後方互換です。
- 貼り付け画像の抽出は既存純関数 `extractImageFilesFromDataTransfer` を再利用します（`ClipboardEvent.clipboardData` は `{ files, types }` を構造的に満たすため、新規抽出ロジックは作っていません）。
- `types.includes("Files")` と MIME `image/*` を満たすファイルだけを受け付けます。テキスト等の貼り付けは無視します。
- 対象 `div`/`section` を `tabIndex` でフォーカス可能にし、React の `onPaste`（フォーカス中の要素からバブル）を当てています。document/window 全体には listen していません。
- `onBlur` は `relatedTarget` が内側ならアクティブ解除しません（既存 `onDragLeave` と同じパターン）。
- 既存画像がある場合の貼り付けは、既存の `onFiles` 経路（圧縮→プレビュー→アップロード）にそのまま流れるため、差し替え挙動も従来の選択/ドロップと同一です。
- Storage、DB schema、RLS、auth、バケット設定は変更していません。
- APIキー、Service Role Key、写真URLの直書きは追加していません。
- Canvas版 `app.html` は編集していません。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0187-photo-clipboard-paste`: pass（lint / typecheck / test / build + policy すべて pass）
- 共通フックの貼り付け抽出について、`use-image-file-drop.test.ts` に clipboard 形状（`types:["Files"]`）からの画像抽出テストと、テキストのみ（Files 無し）が空配列になるテストを追加し、成功しました。

verify結果は `project-os/artifacts/TKT-0187-photo-clipboard-paste/verify.json` に保存済みです。

## 残リスク

- 実ブラウザでのスクリーンショット貼り付け（実 ClipboardEvent）は、自動テストでは抽出純関数の入口までを確認済みです。実機での Ctrl+V 貼り付けは最終の手動確認ポイントとして残ります。
- ブラウザによりクリップボード画像の露出方法に差があります（多くは `clipboardData.files` ＋ `types:["Files"]`）。主対象の Chromium/Firefox では `files` 経由で抽出できる前提です。Safari 等で `files` を介さないケースは未対応です（実機確認ポイント）。
- `check-gates` は作業ツリーに残る無関係ファイル（前セッションの spec/ticket 移動等、計32パス）への語彙マッチで `photo_upload_storage` と `supabase_schema_change` を🔴検出しますが、本チケットの実差分は `web/src/lib/photos/` ＋ 2コンポーネント ＋ `globals.css` のみで、Storage/schema/auth/RLS/API route/バケットは無変更です（TKT-0181/0182 と同方針）。

## 次の依頼や人判断

PCブラウザでレシピ画像エリア／在庫編集の食材画像エリアをクリックし、アクティブ表示と
「クリップボードから貼り付け可（Ctrl+V）」案内が出ること、スクリーンショットを Ctrl+V で
登録・差し替えできることを確認してください。スマホでは従来どおり「画像を選ぶ」から選択してください。
