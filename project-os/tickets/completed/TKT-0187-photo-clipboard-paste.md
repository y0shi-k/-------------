---
id: TKT-0187-photo-clipboard-paste
title: 画像エリアのクリックフォーカス＋クリップボード貼り付け（Ctrl+V）対応
status: completed
goal: レシピ画像／食材画像エリアをクリックでアクティブ化（視覚表示）し、その状態でのみクリップボードの画像を Ctrl+V で登録・差し替えできるようにする（TKT-0181の共通フックを拡張）。
acceptance:
  - レシピ画像エリア（recipe-meal-workspace.tsx）と食材画像エリア（inventory-board.tsx）をクリック/フォーカスすると、アクティブであることが視覚的に分かる（枠/リングのハイライト）
  - アクティブ状態のとき「クリップボードから貼り付け可（Ctrl+V）」の旨のメッセージが表示される
  - アクティブ状態で Ctrl+V すると、クリップボード内の画像が既存のドロップ/クリック選択と同じ圧縮→プレビュー→登録フローに流れる
  - すでに画像がある場合も貼り付けで差し替えできる
  - アクティブ状態でないとき（エリア外にフォーカスがある）は貼り付けが発火しない＝ページ全体のCtrl+Vを奪わない
  - クリップボードに画像が無い貼り付け（テキスト等）は無視され、登録されない
  - 複数画像は先頭1件のみ（食材）/ 既存ドロップと同一挙動（レシピ）
  - 既存のドラッグ&ドロップ・クリック選択・スマホ挙動が従来どおり動作する
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/photos/use-image-file-drop.ts
  - web/src/lib/photos/__tests__/use-image-file-drop.test.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0187-photo-clipboard-paste/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0181-photo-drag-and-drop-registration
owner_role: implementer
owner_notes:
  - 非危険変更（フック拡張＋JSXハンドラ＋CSS＋単体テストのみ）。Storage/schema/auth/RLS/バケットは無変更で、既存の圧縮・アップロード経路（onFiles）を再利用するだけ。
  - `photo_upload_storage` eval が語彙（`photo|image|写真|画像`）で過剰マッチする見込み。実Storage/policy/schema は無変更。report に「実Storage無変更・既存onFiles経路の再利用のみ」と明記すれば manual-smokes/review は不要（TKT-0181/0182 と同方針）。
  - 方式A（フォーカススコープ）採用: 対象 `div`/`section` を `tabIndex={0}` でフォーカス可能にし、React の `onPaste` を当てる。paste はフォーカス中の要素からバブルするため「クリックした時だけ貼り付け可」を自然に満たす。document 全体には listen しない。
  - アクティブ表示は React の `onFocus`/`onBlur`（focus-within 相当・バブルする）で `isActive` を管理し、`data-active` 属性＋CSSで枠/リング表示。`onBlur` は `relatedTarget` が内側なら無視（dragLeave と同じパターン）。
  - 貼り付け抽出は既存 `extractImageFilesFromDataTransfer` を再利用（`ClipboardEvent.clipboardData` は `{ files, types }` を構造的に満たす）。新たな抽出ロジックを作らない。
  - APIキー・写真URL・Service Role Key をブラウザへ出さない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0187-photo-clipboard-paste`。
---

# Summary

写真ドラッグ&ドロップ登録イニシアチブ（SPEC-0181）の追補チケット。レシピ画像／食材画像エリアを
クリックでアクティブ化して視覚表示し、その状態でのみクリップボードの画像を Ctrl+V で登録・差し替え
できるようにする。TKT-0181 の共通フック `useImageFileDrop` を拡張し、`onPaste`／フォーカス管理を
追加する（既存の `onFiles` 経路＝圧縮・アップロードを再利用）。

## 実装メモ

- 編集:
  - `web/src/lib/photos/use-image-file-drop.ts`: `onPaste`（ClipboardEvent→`extractImageFilesFromDataTransfer`→`onFiles`）と `onFocus`/`onBlur` による `isActive` 管理を追加。`pasteAreaProps`（`tabIndex`/`onFocus`/`onBlur`/`onPaste`）と `isActive` を返す。既存 `dragHandlers`/`isDraggingOver` は据え置き（後方互換）。
  - `web/src/components/recipe-meal-workspace.tsx`: `.recipe-image-field` に `pasteAreaProps` を spread、`data-active={isActive}` を付与。アクティブ時の貼り付け案内メッセージを表示。
  - `web/src/components/inventory-board.tsx`: `.ingredient-image-editor` に同様適用。
  - `web/src/app/globals.css`: `[data-active="true"]` のリング表示と案内メッセージのスタイルを最小追加。
  - `web/src/lib/photos/__tests__/use-image-file-drop.test.ts`: clipboard 形状（`types:["Files"]`）からの画像抽出テストを追加。
