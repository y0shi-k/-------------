---
id: SPEC-0181-photo-drag-and-drop-registration
title: 写真エリアへのドラッグ&ドロップ登録
status: draft
scope:
  - レシピ画像エリア（RecipeImagePicker / recipe-meal-workspace.tsx）
  - 食材画像エリア（inventory-board.tsx の在庫編集UI）
  - 料理完成写真エリア①（recipe-meal-workspace.tsx のレシピ編集内）
  - 料理完成写真エリア②（cooking-record-edit-modal.tsx・複数対応）
  - 上記4エリアへのファイルのドラッグ&ドロップ登録と、ドラッグ中の枠ハイライト
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Storage / DB schema / RLS / auth / バケット設定を一切変更しない。既存の圧縮・アップロード関数を再利用するだけ
  - 既存のクリック/タップによる `<input type="file">` 選択（スマホのフォールバック）を温存する
  - 既存の献立カード移動ドラッグ（`text/plain` でID受け渡し）と混同しない。ファイルドロップは `event.dataTransfer.types.includes("Files")` で判定する
  - 入力方法はドロップのみ（クリップボード貼付 Ctrl+V は対象外）
  - 個人データ・写真を扱うため、APIキー・写真URL・Service Role Key をブラウザへ露出しない
acceptance:
  - 4エリアそれぞれで、画像ファイルをエリアにドロップすると既存のクリック選択と同じ登録フロー（圧縮→プレビュー→保存）が走る
  - ドラッグ中はエリアに枠ハイライト（点線枠＋色変化）が表示され、ドロップ/ドラッグ離脱で解除される
  - 非画像ファイルをドロップしても登録されない（image/* 以外は無視）
  - 料理完成写真②のエリアは複数画像のドロップを受け付ける
  - スマホの既存タップ選択挙動が変わらない
  - 献立カードのドラッグ移動が壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0181-photo-drop-foundation-recipe-image
  - TKT-0182-photo-drop-ingredient-image
  - TKT-0183-photo-drop-cooking-photos
---

# Summary

写真の登録を、各写真エリアにファイルをドラッグ&ドロップして行えるようにする。共通の薄い土台
（ドロップ用フック＋画像ファイル抽出の純関数）を1つ作り、4つの写真エリアへ横展開する。
Storage/schema/auth は一切変更せず、既存のアップロード経路を再利用する純粋なUI拡張。

## 背景

現状、写真登録は4箇所すべてで「クリック/タップ → `<input type="file">` 選択」のみで、PCユーザーが
ファイルをエリアに直接ドロップして登録できない。操作が一手間多く、参考モックの体験から離れている。
ドラッグ&ドロップはPCデスクトップでの利便性向上が目的で、スマホは従来のタップ選択を温存する。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`
- 共通の土台（TKT-0181 で新規）:
  - フック `useImageFileDrop`（`onDragOver` / `onDragLeave` / `onDrop` ハンドラと `isDraggingOver` 状態を返す）
  - 純関数: `DataTransfer` から画像ファイルだけを抽出（`types.includes("Files")` 判定 ＋ MIME `image/*` フィルタ、複数対応）。単体テスト対象
  - ドラッグ時ハイライトの最小CSS（`globals.css`）。`isDraggingOver` でトグル
- 各エリアは上記フックを当て、ドロップされた File を**各エリア既存の選択ハンドラ相当**（圧縮→プレビュー→保存）へ流す
- 圧縮/アップロードは既存を再利用:
  - レシピ画像: `compressRecipeImageFile`（`web/src/lib/photos/compress.ts`）/ `uploadRecipeImage`（`web/src/lib/photos/recipe-image-upload.ts`）
  - 食材画像: `compressIngredientImageFile` ＋ 既存 `supabase.storage.from("photos").upload()` 経路
  - 料理完成写真: `compressImageFile` ＋ 既存 `photos` テーブル登録経路
- verify: `/verify`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
- Web版ポリシー: GAS/Spreadsheet/Driveを使わず、Next.js + Supabase + Vercelで実装する。APIキーや秘密鍵は環境変数で管理する。

## 非対象

- クリップボード貼付（Ctrl+V）での画像登録
- 写真Storage / schema / RLS / バケット設定の変更
- 画像ピッカーUIの全面共通コンポーネント化（ドロップの薄い土台のみ共通化し、各エリアのUI構造は温存）
- スマホでのドラッグ&ドロップ（OS仕様上ファイルD&D非対応のため対象外。タップ選択を温存）

## Acceptance Example

- 各 TKT の `project-os/artifacts/TKT-xxxx/` の verify.json と report.md で達成可否を判定する
- ドロップ判定（Files限定・image/*限定）とハイライトのトグルは、純関数の単体テスト＋PC手動スモークで確認する
- Storage/schema/auth 無変更を report に明記する（`photo_upload_storage` eval の語彙過剰マッチ対策）
