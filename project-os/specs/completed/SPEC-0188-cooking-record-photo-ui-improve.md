---
id: SPEC-0188-cooking-record-photo-ui-improve
title: 料理記録 編集モーダルの写真UI改善（既存×即削除＋新規サムネ＋削除予定Undo）
status: draft
scope:
  - 料理記録の編集モーダル `cooking-record-edit-modal.tsx` の完成写真エリア（既存写真リスト・新規追加写真リスト）
  - 既存写真の削除UI（テキストトグル→サムネ右上×）と削除予定の復元導線
  - 新規追加写真のプレビュー表示（ファイル名→サムネ）
constraints:
  - 触らない範囲: 写真の実削除/実アップロードのロジック（savePhotoChanges / addNewPhotos / handleNewPhotosChange の処理本体）。表示と取り消しUIだけを差し替える
  - カレンダー/タイムライン側の閲覧導線（→ SPEC-0189）は対象外
  - Storage / schema / RLS / auth / バケット設定は変更しない（既存の signed_url・既存削除/追加経路の再利用のみ）
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真・auth/RLS のロジックは変更しない（表示のみ）
acceptance:
  - 編集モーダルの既存写真が、各サムネ右上に×ボタンを持つ形で表示される。
  - 既存写真の×を押すと確認ダイアログなしで即その写真がリストから消える（削除予定になる）。
  - 既存写真の実Storage/DB削除は従来どおり「確定」時に実行され、「キャンセル」では何も削除されない。
  - 削除予定にした既存写真は「削除予定 N件（元に戻す）」の導線から復元できる。
  - 新規追加した写真が、ファイル名テキストではなくサムネ画像で表示される。
  - 新規追加写真の各サムネ右上の×で、その写真を追加候補から取り消せる。
  - 新規写真のプレビューURLは取り消し時・モーダル破棄時に revokeObjectURL で解放される。
  - 既存のクリック選択・D&D・Ctrl+V貼り付け・複数追加が従来どおり動作する。
  - スマホ幅でサムネグリッドが崩れない（横はみ出ししない）。
  - Web版 verify（lint/typecheck/test/build）が通る。
related_tickets:
  - TKT-0188-cooking-record-photo-ui-improve
---

# Summary

料理記録の編集モーダルの写真UIを改善する。既存写真はサムネ右上の×で確認なしに削除予定化（実削除は「確定」時・
キャンセルで復活・誤操作は「元に戻す」で救済）、新規追加写真はファイル名でなくサムネで表示し右上×で取り消せるようにする。
削除・追加の処理本体は変えず、表示と取り消しUIだけを差し替える非危険変更。

## 背景

編集モーダルで、(1) 既存写真の削除が「削除／削除を取り消す」テキストトグルでわかりにくい、(2) 新規追加した写真が
ファイル名でしか表示されず中身が見えない、という使い勝手の問題がある。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`
- 対象コンポーネント: `web/src/components/cooking-record-edit-modal.tsx`
  - `ExistingPhotoList`（既存写真）: テキストトグル廃止→サムネ右上×。×=確認なしで `deletedPhotoIds` 追加→即非表示。下部に「削除予定 N件（元に戻す）」復元導線。
  - new-photo-list（新規写真）: ファイル名ボタン廃止→サムネグリッド＋右上×。`URL.createObjectURL` でプレビュー、取り消し/unmount で `URL.revokeObjectURL`。
- 対象CSS: `web/src/app/globals.css`（共有サムネグリッド `.photo-thumb-grid` / `.photo-thumb` / `.photo-thumb-remove`、削除予定ノート）
- 実削除/実追加の本体（`savePhotoChanges` / `addNewPhotos` / `handleNewPhotosChange`）は変更しない。
- verify: `/verify`

## 非対象

- カレンダー/タイムラインの閲覧導線（枚数バッジ・閲覧モーダル）（→ SPEC-0189）。
- 写真Storage / schema / RLS / バケット設定の変更。
- 既存写真を「確定」前に即Storage削除する挙動。

## Acceptance Example

- 写真を複数持つ料理記録を編集で開き、既存写真の×で即非表示・「削除予定」表示・「元に戻す」復元を確認し report に記録する。
- 写真を複数ドロップ/選択して新規追加がサムネ表示され、×で取り消せることを確認する。
