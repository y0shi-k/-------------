---
id: TKT-0181-photo-drop-foundation-recipe-image
title: 写真ドロップ共通基盤＋レシピ画像エリアへ適用（ドラッグ&ドロップ登録）
status: implementation_ready
goal: ファイルのドラッグ&ドロップを受ける共通の薄い仕組み（フック＋画像抽出純関数）を作り、レシピ画像エリアで実証する。以降の横展開（TKT-0182/0183）の土台にする。
acceptance:
  - 新規フック `useImageFileDrop` が `onDragOver` / `onDragLeave` / `onDrop` ハンドラと `isDraggingOver` 状態を返す
  - 新規純関数が `DataTransfer` から画像ファイル（MIME `image/*`）だけを配列で抽出し、`types.includes("Files")` でない/画像なしの場合は空配列を返す
  - 上記純関数の単体テストが追加される（Filesなし=空 / 非画像のみ=空 / 画像1件 / 画像複数 / 画像と非画像混在=画像のみ）
  - `RecipeImagePicker`（recipe-meal-workspace.tsx）のエリアに画像をドロップすると、既存のクリック選択（`selectRecipeImage` 相当）と同じ圧縮→プレビュー→保存フローが走る
  - ドラッグ中はレシピ画像エリアに枠ハイライト（点線枠＋色変化）が表示され、ドロップ/ドラッグ離脱で解除される
  - 非画像ファイルをドロップしても登録されない
  - レシピ画像エリアの既存クリック選択（`<input type="file">`）が従来どおり動作する
  - 献立カードのドラッグ移動（`text/plain` 経由）が壊れない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/photos/use-image-file-drop.ts
  - web/src/lib/photos/__tests__/use-image-file-drop.test.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0181-photo-drop-foundation-recipe-image/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0181-photo-drag-and-drop-registration
related_artifacts:
  - artifacts/TKT-0181-photo-drop-foundation-recipe-image/verify.json
  - artifacts/TKT-0181-photo-drop-foundation-recipe-image/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（フック＋純関数＋JSXハンドラ＋CSSのみ）。Storage/schema/auth/RLS/バケットは無変更で、既存の圧縮・アップロード関数を再利用するだけ。
  - `photo_upload_storage` eval が `diff_regex_any` の `photo|image|写真|画像` / `upload\(` で語彙過剰マッチする見込み。実Storage/policy/schema は無変更。`/check-gates` で 🔴 が出ても、report に「実Storage無変更・既存アップロード経路の再利用のみ」と明記すれば manual-smokes/review は不要（TKT-0169/0177 と同方針）。
  - 既存の献立カード移動ドラッグ（recipe-meal-workspace.tsx ≈L2265-2286, L2428-2456。`text/plain` でID受け渡し）と必ず区別する。ファイルドロップは `event.dataTransfer.types.includes("Files")` で判定。
  - 適用先: `RecipeImagePicker`（recipe-meal-workspace.tsx ≈L3118-3179）。ドロップ時は既存 `selectRecipeImage`（≈L394-411）が `<input>` の `FileList` を受けて行う処理（`compressRecipeImageFile` → プレビュー生成 → 保存）と同じ経路へ抽出済み File を流す。`selectRecipeImage` を File 配列/単一 File も受けられる形に小さくリファクタするか、共通の内部ハンドラを切り出して input/onDrop の両方から呼ぶ。
  - 圧縮: `compressRecipeImageFile`（`web/src/lib/photos/compress.ts` ≈L124-158, 4:3中央クロップ＋1280px）。アップロード: `uploadRecipeImage`（`web/src/lib/photos/recipe-image-upload.ts` ≈L53-87）。新規追加しない。
  - 純関数は例外を投げず File[] を返す設計にして単体テスト可能にする（jsdom で `DataTransfer` を直接作れないため、`{ types: string[], files: File[], items?: ... }` 相当の最小インターフェイスを引数に取る純関数として切り出す）。
  - ハイライトCSSは `globals.css` の既存 `.recipe-image-picker` 周辺に最小追加。`isDraggingOver` で付与するクラス名を1つ足す程度。スマホ幅でレイアウトを崩さない。
  - APIキー・写真URL・Service Role Key をブラウザへ出さない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0181-photo-drop-foundation-recipe-image`。
---

# Summary

写真の登録をドラッグ&ドロップで行えるようにするイニシアチブ（SPEC-0181）の**土台チケット**。
ファイルドロップを受ける共通フック `useImageFileDrop` と、`DataTransfer` から画像ファイルだけを
抽出する純関数を新規作成し、まずレシピ画像エリア（`RecipeImagePicker`）で実証する。
ドラッグ中は枠ハイライトを出す。Storage/schema/auth は無変更で既存アップロード経路を再利用する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）。現役正本（編集対象）は `web/`。
- 新規ファイル:
  - `web/src/lib/photos/use-image-file-drop.ts`: `useImageFileDrop({ disabled?, onFiles }) => { isDraggingOver, dragHandlers: { onDragOver, onDragLeave, onDrop } }`。
    - `onDragOver`: ファイルドラッグ時のみ `preventDefault()` して `isDraggingOver=true`。`event.dataTransfer.types.includes("Files")` で判定。
    - `onDragLeave`: `isDraggingOver=false`。
    - `onDrop`: `preventDefault()` → 純関数で画像 File[] を抽出 → 1件以上なら `onFiles(files)` → `isDraggingOver=false`。
    - 画像抽出の純関数（同ファイル export か `web/src/lib/photos/` 内の別ファイル）: 引数は最小インターフェイス（`{ types: ReadonlyArray<string>; files: ArrayLike<File> }`）。`types` に "Files" が無ければ `[]`、`files` から `type.startsWith("image/")` のみ返す。
  - `web/src/lib/photos/__tests__/use-image-file-drop.test.ts`: 純関数の単体テスト（Filesなし/非画像のみ/画像1/画像複数/混在）。
- 編集:
  - `web/src/components/recipe-meal-workspace.tsx`: `RecipeImagePicker`（≈L3118-3179）のドロップ対象 `<div>` に `useImageFileDrop` の `dragHandlers` と `isDraggingOver` を当てる。`onFiles` は既存のレシピ画像選択処理（`selectRecipeImage` 相当の内部関数）へ単一 File（先頭）を渡す。`selectRecipeImage`（≈L394-411）は現状 input イベント前提なので、File を直接受ける内部関数を切り出して input/onDrop 双方から呼ぶ形にする。
  - `web/src/app/globals.css`: `.recipe-image-picker`（または該当エリア）周辺にドラッグ中ハイライトクラスを追加。
- 既存パターン参照:
  - 圧縮: `compressRecipeImageFile`（`web/src/lib/photos/compress.ts`）。
  - アップロード: `uploadRecipeImage`（`web/src/lib/photos/recipe-image-upload.ts`）。
  - 既存テスト: `web/src/__tests__/compress-recipe-image.test.ts`, `recipe-image-upload.test.ts`。
- 注意:
  - Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）。
  - GAS/Spreadsheet/Driveを使わない。APIキー・Service Role Key を直書きしない。
  - 献立カード移動ドラッグと混同しない（Files 判定で分岐）。スマホのタップ選択を温存。

## 非ゴール

- 食材画像エリアへの適用（→ TKT-0182）。
- 料理完成写真エリアへの適用（→ TKT-0183）。
- クリップボード貼付（Ctrl+V）対応。
- 画像ピッカーUIの全面共通コンポーネント化（ドロップの薄い土台のみ共通化）。
- 写真Storage / schema / RLS / バケット設定の変更。

## 依存チケット

- 先行依存なし（土台）。TKT-0182 / TKT-0183 は本チケットの `useImageFileDrop` と純関数に依存する。

## 残リスク

- `selectRecipeImage` の内部リファクタ（File を直接受ける形への切り出し）で既存クリック選択に回帰が出ないこと。verify とテストで確認する。
- jsdom で `DataTransfer` を直接生成できないため、ドロップ判定の単体テストは純関数（最小インターフェイス引数）に対して行う。フック自体のE2Eは PC 手動スモークで補う。
