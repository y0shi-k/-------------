---
id: TKT-0183-photo-drop-cooking-photos
title: 料理完成写真エリアへドラッグ&ドロップ登録を適用（複数対応）
status: completed
goal: 料理完成写真の2エリア（レシピ編集内・料理記録モーダル）で画像ファイルのドラッグ&ドロップ登録を可能にする。料理記録モーダルは複数画像のドロップに対応する（TKT-0181の共通基盤を流用）。
acceptance:
  - レシピ編集内の料理完成写真エリア（recipe-meal-workspace.tsx）に画像をドロップすると、既存のクリック選択と同じ圧縮→プレビュー→保存フローが走る
  - 料理記録モーダルの完成写真エリア（cooking-record-edit-modal.tsx）に画像をドロップすると、既存の `handleNewPhotosChange` 相当と同じフローが走り、複数画像のドロップを受け付ける
  - ドラッグ中は各エリアに枠ハイライト（点線枠＋色変化）が表示され、ドロップ/ドラッグ離脱で解除される
  - 非画像ファイルをドロップしても登録されない
  - 各エリアの既存クリック選択（`<input type="file">`）が従来どおり動作する
  - 献立カードのドラッグ移動（`text/plain` 経由）が壊れない
  - スマホの既存タップ選択挙動が変わらない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/__tests__/cooking-record-edit-modal.test.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0183-photo-drop-cooking-photos/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0181-photo-drag-and-drop-registration
related_artifacts:
  - artifacts/TKT-0183-photo-drop-cooking-photos/verify.json
  - artifacts/TKT-0183-photo-drop-cooking-photos/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（JSXハンドラ＋CSSのみ）。Storage/schema/auth/RLS/バケットは無変更で、既存の圧縮・アップロード経路を再利用するだけ。
  - `photo_upload_storage` eval が語彙（`photo|image|写真|画像` / `upload\(`）で過剰マッチする見込み。実Storage/policy/schema は無変更。`/check-gates` で 🔴 が出ても report に「実Storage無変更・既存経路の再利用のみ」と明記すれば manual-smokes/review は不要（TKT-0169/0177 と同方針）。
  - 適用先①: 料理完成写真UI（recipe-meal-workspace.tsx ≈L1564-1589）。ドロップ→既存の料理写真選択処理（`compressImageFile` → プレビュー → `photos` 登録経路）へ。単一/複数は既存挙動に合わせる。
  - 適用先②: 料理記録モーダル（cooking-record-edit-modal.tsx ≈L352-357, `multiple` 対応）。ドロップ→既存 `handleNewPhotosChange`（≈L271-290 で `compressImageFile` → `photos` 登録）へ **File 配列**を流す。複数画像のドロップを受け付ける。
  - 共通基盤は TKT-0181 の `web/src/lib/photos/use-image-file-drop.ts` を import して使う。`useImageFileDrop` の `onFiles(files: File[])` が File 配列を返す前提で、①は先頭1件、②は配列全体を既存ハンドラへ渡す。新たに基盤を作らない。
  - 既存の献立カード移動ドラッグ（recipe-meal-workspace.tsx ≈L2265-2286, L2428-2456。`text/plain` でID受け渡し）と必ず区別する。ファイルドロップは `event.dataTransfer.types.includes("Files")` で判定（TKT-0181 のフックが担保）。
  - 圧縮: `compressImageFile`（`web/src/lib/photos/compress.ts` ≈L68-94）。Storageパス: `buildCookingHistoryPhotoStoragePath`（同 compress.ts）。既存の `photos` テーブル登録経路を再利用（新規追加しない）。
  - 全Storage/DBクエリは既存どおり本人領域限定。新規RLS・新規バケットを作らない。
  - ハイライトCSSは `globals.css` の料理写真エリア周辺に最小追加（TKT-0181 と同じトーン／可能なら同じクラスを流用）。スマホ幅で崩さない。
  - APIキー・写真URL・Service Role Key をブラウザへ出さない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0183-photo-drop-cooking-photos`。
---

# Summary

写真ドラッグ&ドロップ登録イニシアチブ（SPEC-0181）の横展開チケット。料理完成写真の2エリア
（レシピ編集内・料理記録モーダル）に TKT-0181 の共通フック `useImageFileDrop` を当て、
画像のドロップ登録とドラッグ中ハイライトを追加する。料理記録モーダルは複数画像のドロップに対応する。
既存の `compressImageFile` ＋ `photos` 登録経路を再利用する。

## 実装メモ

- プロジェクト名: Stock Master。現役正本（編集対象）は `web/`。
- 編集:
  - `web/src/components/recipe-meal-workspace.tsx`: 料理完成写真UI（≈L1564-1589）のドロップ対象 `<div>` に TKT-0181 の `useImageFileDrop` を当てる。`onFiles` は既存の料理写真選択処理へ先頭 File を渡す（既存が単一なら単一、複数対応なら配列）。
  - `web/src/components/cooking-record-edit-modal.tsx`: 完成写真エリア（≈L352-357）のドロップ対象に `useImageFileDrop` を当て、`onFiles(files)` の **配列全体**を `handleNewPhotosChange` 相当へ渡す。`handleNewPhotosChange` が `FileList`/`File[]` を受ける形に小さく揃え、input/onDrop 双方から呼ぶ。
  - `web/src/app/globals.css`: 料理写真エリア周辺にドラッグ中ハイライトクラスを追加（TKT-0181 と同じトーン／可能なら同じクラスを流用）。
- 既存パターン参照:
  - 共通基盤: `web/src/lib/photos/use-image-file-drop.ts`（TKT-0181 新規）。
  - 圧縮: `compressImageFile`（`web/src/lib/photos/compress.ts`）。Storageパス: `buildCookingHistoryPhotoStoragePath`（同 compress.ts）。
  - 既存の `photos` テーブル登録（cooking-record-edit-modal.tsx ≈L271-290）。
- 注意:
  - Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）。
  - GAS/Spreadsheet/Driveを使わない。APIキー・Service Role Key を直書きしない。
  - 献立カード移動ドラッグと混同しない（Files 判定で分岐）。スマホのタップ選択を温存。

## 非ゴール

- レシピ画像 / 食材画像エリアへの適用（→ TKT-0181 / TKT-0182）。
- クリップボード貼付（Ctrl+V）対応。
- 料理履歴画面（カレンダー/タイムライン）側の表示改修。
- 写真Storage / schema / RLS / バケット設定の変更。

## 依存チケット

- TKT-0181-photo-drop-foundation-recipe-image（共通フック `useImageFileDrop` と画像抽出純関数を提供）。本チケットはこれに依存。
- TKT-0182 とは独立（複数ファイル対応の差分を含むため別チケット）。実装順は任意だが TKT-0181 完了が前提。

## 残リスク

- `handleNewPhotosChange` の内部リファクタ（File[] を受ける形への調整）で既存の複数選択アップロードに回帰が出ないこと。verify で確認する。
- 複数画像同時ドロップ時の圧縮・アップロードの逐次/並列の扱いは既存 `handleNewPhotosChange` の挙動に合わせる（新規の並列化はしない）。
