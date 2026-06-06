---
id: TKT-0182-photo-drop-ingredient-image
title: 食材画像エリアへドラッグ&ドロップ登録を適用
status: implementation_ready
goal: 在庫編集の食材画像エリアで、画像ファイルのドラッグ&ドロップ登録を可能にする（TKT-0181の共通基盤を流用）。
acceptance:
  - 在庫編集の食材画像エリア（inventory-board.tsx）に画像をドロップすると、既存のクリック選択（`selectIngredientImage` 相当）と同じ圧縮→プレビュー→アップロードフローが走る
  - ドラッグ中は食材画像エリアに枠ハイライト（点線枠＋色変化）が表示され、ドロップ/ドラッグ離脱で解除される
  - 単一画像のみ受け付ける（複数ドロップ時は先頭1件）
  - 非画像ファイルをドロップしても登録されない
  - 食材画像エリアの既存クリック選択（`<input type="file">`）が従来どおり動作する
  - スマホの既存タップ選択挙動が変わらない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0182-photo-drop-ingredient-image/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0181-photo-drag-and-drop-registration
related_artifacts:
  - artifacts/TKT-0182-photo-drop-ingredient-image/verify.json
  - artifacts/TKT-0182-photo-drop-ingredient-image/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（JSXハンドラ＋CSSのみ）。Storage/schema/auth/RLS/バケットは無変更で、既存の圧縮・アップロード経路を再利用するだけ。
  - `photo_upload_storage` eval が語彙（`photo|image|写真|画像` / `upload\(`）で過剰マッチする見込み。実Storage/policy/schema は無変更。`/check-gates` で 🔴 が出ても report に「実Storage無変更・既存経路の再利用のみ」と明記すれば manual-smokes/review は不要（TKT-0169/0177 と同方針）。
  - 適用先: 食材画像UI（inventory-board.tsx ≈L1079-1141）。ドロップ時は既存 `selectIngredientImage`（≈L554-573）と同じ処理（`compressIngredientImageFile` → プレビュー → `supabase.storage.from("photos").upload()`）へ抽出済み File（先頭1件）を流す。input/onDrop の両方から呼べる内部ハンドラに揃える。
  - 共通基盤は TKT-0181 の `web/src/lib/photos/use-image-file-drop.ts`（フック＋画像抽出純関数）を import して使う。新たに基盤を作らない。
  - 圧縮: `compressIngredientImageFile`（`web/src/lib/photos/compress.ts` ≈L164-197, アスペクト保持＋1024px）。Storageパス: `buildInventoryImageStoragePath` 等の既存ヘルパーを再利用（新規追加しない）。
  - 全Storage/DBクエリは既存どおり本人領域限定（`.eq("user_id", ...)`／`user_ingredient_images` への記録も既存パターン踏襲）。新規RLS・新規バケットを作らない。
  - 注意: 食材スキャン用の `<input>`（inventory-board.tsx ≈L1240, AI解析用）は本チケットの対象外。AI経路（`ai_server_route`）に触れないこと。対象はあくまで「食材の標準/登録画像」エリアのみ。
  - ハイライトCSSは `globals.css` の食材画像エリア周辺に最小追加。スマホ幅でカードを潰さない。
  - APIキー・写真URL・Service Role Key をブラウザへ出さない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0182-photo-drop-ingredient-image`。
---

# Summary

写真ドラッグ&ドロップ登録イニシアチブ（SPEC-0181）の横展開チケット。在庫編集の食材画像エリアに
TKT-0181 で作った共通フック `useImageFileDrop` を当て、画像のドロップ登録とドラッグ中ハイライトを
追加する。単一画像。既存の `selectIngredientImage` の圧縮・アップロード経路を再利用する。

## 実装メモ

- プロジェクト名: Stock Master。現役正本（編集対象）は `web/`。
- 編集:
  - `web/src/components/inventory-board.tsx`: 食材画像UI（≈L1079-1141）のドロップ対象 `<div>` に TKT-0181 の `useImageFileDrop` の `dragHandlers` と `isDraggingOver` を当てる。`onFiles` は既存の食材画像選択処理（`selectIngredientImage` 相当の内部関数）へ先頭 File を渡す。`selectIngredientImage`（≈L554-573）が input イベント前提なら、File を直接受ける内部関数を切り出して input/onDrop 双方から呼ぶ。
  - `web/src/app/globals.css`: 食材画像エリア周辺にドラッグ中ハイライトクラスを追加（TKT-0181 と同じトーン／可能なら同じクラスを流用）。
- 既存パターン参照:
  - 共通基盤: `web/src/lib/photos/use-image-file-drop.ts`（TKT-0181 新規）。
  - 圧縮: `compressIngredientImageFile`（`web/src/lib/photos/compress.ts`）。Storageパス: `buildInventoryImageStoragePath`（同 compress.ts）。
  - 既存テスト: `web/src/__tests__/ingredient-image.test.ts`。
- 注意:
  - Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）。
  - GAS/Spreadsheet/Driveを使わない。APIキー・Service Role Key を直書きしない。
  - 食材スキャン（AI解析）用 input は対象外。AI route に触れない。
  - スマホのタップ選択を温存。

## 非ゴール

- 食材スキャン（AI画像解析）用 input へのドロップ対応。
- レシピ画像 / 料理完成写真エリアへの適用（→ TKT-0181 / TKT-0183）。
- クリップボード貼付（Ctrl+V）対応。
- 写真Storage / schema / RLS / バケット設定の変更。

## 依存チケット

- TKT-0181-photo-drop-foundation-recipe-image（共通フック `useImageFileDrop` と画像抽出純関数を提供）。本チケットはこれに依存。

## 残リスク

- `selectIngredientImage` の内部リファクタで既存クリック選択に回帰が出ないこと。verify と既存テストで確認する。
