---
id: TKT-0188-cooking-record-photo-ui-improve
title: 料理記録 編集モーダルの写真UI改善（既存×即削除＋新規サムネ＋削除予定Undo）
status: completed
goal: 料理記録の編集モーダルで写真の削除・追加プレビューをわかりやすくする。既存写真はサムネ右上の×で確認なしに削除予定化し（実削除は「確定」時・キャンセルで復活）、新規追加写真はファイル名でなくサムネで表示して右上×で取り消せるようにする。削除予定は「元に戻す」で復元できる。
acceptance:
  - 編集モーダル（cooking-record-edit-modal.tsx）の既存写真が、各サムネの右上に×ボタンを持つ形で表示される
  - 既存写真の×を押すと、確認ダイアログなしで即その写真がリストから消える（削除予定になる）
  - 既存写真の実際のStorage/DB削除は従来どおり「確定」時に実行され、「キャンセル」では何も削除されない
  - 削除予定にした既存写真は「削除予定 N件（元に戻す）」の導線から復元できる
  - 新規追加した写真が、ファイル名テキストではなくサムネ画像で表示される
  - 新規追加写真の各サムネ右上の×で、その写真を追加候補から取り消せる
  - 新規写真のプレビューURLは取り消し時・モーダル破棄時に revokeObjectURL で解放される（メモリリークしない）
  - 既存のクリック選択・ドラッグ&ドロップ・Ctrl+V貼り付け・複数追加が従来どおり動作する
  - スマホ幅でサムネグリッドが崩れない（横はみ出ししない）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/__tests__/cooking-record-edit-modal.test.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0188-cooking-record-photo-ui-improve/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0188-cooking-record-photo-ui-improve
related_artifacts:
  - artifacts/TKT-0188-cooking-record-photo-ui-improve/verify.json
  - artifacts/TKT-0188-cooking-record-photo-ui-improve/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（JSX＋CSS＋テストのみ）。Storage/schema/auth/RLS/バケットは無変更。既存写真の実削除は既存の savePhotoChanges（≈L253-302・storage.remove＋photos delete）を「確定」時に呼ぶ経路をそのまま使う。×は UI上の削除予定トグル（deletedPhotoIds）に過ぎず、即時 Storage 削除はしない（ユーザー確定済み: 確定時に実削除）。
  - `photo_upload_storage` eval が語彙（`photo|image|写真|画像` / storage.remove）で過剰マッチする見込み。実Storage/policy/schema は無変更。report に「実Storage無変更・既存削除/追加経路の再利用のみ」と明記すれば manual-smokes/review は不要（TKT-0181/0183 と同方針）。
  - 既存写真UI: `ExistingPhotoList`（cooking-record-edit-modal.tsx ≈L526-557）。現状は写真下に「削除／削除を取り消す」テキストトグル。これを各サムネ右上の×ボタンへ置換。×押下=確認なしで `toggleDeletedPhoto`（deletedPhotoIds 追加）→ 削除予定の写真はグリッドから即非表示。リスト下部に「削除予定 N件（元に戻す）」を出し、押すと deletedPhotoIds を空にして復元（誤操作救済・確認ダイアログは出さない）。
  - 新規写真UI: 現状 new-photo-list（≈L359-367）は「`ファイル名` を取り消す」テキストボタン。これをサムネグリッドへ置換。各 File から `URL.createObjectURL` でプレビューを作り、サムネ右上の×で `removeNewPhoto(index)`。プレビューURLは useEffect か useMemo＋クリーンアップで `revokeObjectURL`（取り消し時・unmount 時）。新規写真は File[] のため index 安定キーに注意（`${name}-${index}` 等）。
  - 既存写真と新規写真は可能なら同じサムネグリッドの見た目に寄せる（`.existing-photo-list` を流用・拡張、`.new-photo-list` をサムネ化）。×ボタンは小さな丸ボタンで右上に absolute 配置。
  - 削除ロジック・追加アップロードロジック（savePhotoChanges、addNewPhotos、handleNewPhotosChange）は挙動を変えない。UI（表示と×トグル）だけ差し替える。
  - APIキー・写真URL・Service Role Key を直書きしない。console.log を残さない。Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
  - verify は `/verify TKT-0188-cooking-record-photo-ui-improve`。
---

# Summary

料理記録の編集モーダル（`cooking-record-edit-modal.tsx`）の写真UIを改善する。
既存写真はサムネ右上の×で確認なしに削除予定化（実削除は「確定」時・キャンセルで復活・誤操作は「元に戻す」で救済）、
新規追加写真はファイル名でなくサムネで表示し右上×で取り消せるようにする。削除・追加の処理本体は変えず、表示と取り消しUIだけを差し替える非危険変更。

## 実装メモ

- プロジェクト名: Stock Master。現役正本（編集対象）は `web/`。
- 編集:
  - `web/src/components/cooking-record-edit-modal.tsx`:
    - `ExistingPhotoList`（≈L526-557）: テキストトグル廃止→サムネ右上×ボタン。×=確認なしで `onToggleDeleted`（deletedPhotoIds 追加）→ 削除予定は即非表示。リスト下に「削除予定 N件（元に戻す）」復元導線。
    - new-photo-list（≈L359-367）: ファイル名ボタン廃止→サムネグリッド＋右上×。`URL.createObjectURL` でプレビュー、取り消し/unmount で `URL.revokeObjectURL`。
  - `web/src/app/globals.css`: `.existing-photo-list` / `.new-photo-list` をサムネグリッド化。×丸ボタンの absolute 配置。スマホ幅で崩さない。
  - `web/src/__tests__/cooking-record-edit-modal.test.tsx`: 既存写真×で非表示＋復元、新規写真がサムネ（img）で表示＋×取り消し、のテストを追加。
- 既存パターン参照:
  - 削除実体: `savePhotoChanges`（≈L253-302）= storage.remove + photos delete を「確定」時に実行。
  - 追加実体: `addNewPhotos` / `handleNewPhotosChange`（File[] 受け）。
- 注意:
  - Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）。
  - GAS/Spreadsheet/Driveを使わない。APIキー・Service Role Key を直書きしない。
  - 削除/追加の処理本体は変えず、UI（表示・×トグル）だけ差し替える。

## 非ゴール

- カレンダー/タイムライン側の閲覧導線（枚数バッジ・閲覧モーダル）→ TKT-0189。
- 写真Storage / schema / RLS / バケット設定の変更。
- 既存写真を「確定」前に即Storage削除する挙動（ユーザー確定: 確定時に実削除）。

## 依存チケット

- なし（TKT-0189 とは独立。並行可）。

## 残リスク

- 新規写真プレビューの `revokeObjectURL` 漏れがないこと（取り消し・差し替え・連続追加・unmount の各経路）。verify とテストで確認する。
- 「削除予定 N件（元に戻す）」の状態と確定時削除（savePhotoChanges）の整合（復元したら削除しない）。
