# TKT-0024 Review

## 実装概要

- GDrive直下に「料理レシピ・食材管理_Canvasアプリ」フォルダを作成し、その中にスプシと写真を保存するように変更
- 全5シートに「最終編集日時」カラムを追加し、追加・更新時に自動で日時をセット

## コードレビュー

### handleInit()

- `DriveApp.getFoldersByName` → `DriveApp.createFolder` のフォールバック実装は正しい
- `file.moveTo(folder)` でスプシをフォルダ内に移動している
- 全5シートのヘッダー配列に「最終編集日時」を追加
- `ensureHeader` は既存列の欠損を検出して補完するため、新規カラム追加にも対応

### syncPendingChanges()

- フォルダ取得をペイロード先頭で行っている
- `var now = ...` を定義し、一貫して全書き込み処理に適用
- 写真保存時に `file.moveTo(folder)` を実行
- 各シートの列数変更に伴い、`setValues` の範囲と `appendRow` の配列長を正しく調整
- 読み出し関数（`readInventory`, `readShopping`, `readRecipes`, `readSchedule`）は新カラムを参照しないため変更なし

### 変更箇所一覧

| 関数 | 変更内容 |
|-----|---------|
| `handleInit()` | フォルダ作成/取得、スプシ移動、ヘッダー更新 |
| `syncPendingChanges()` | フォルダ取得、now定義、全書き込みに最終編集日時追加、写真保存先変更 |

### 懸念事項

- 既存スプシがある場合、新規スプシが別IDで作成される（ユーザー了承済み）
- `DriveApp.getFoldersByName` は複数フォルダが存在する場合、最初の1つを使用する。同名フォルダが複数ある場合、意図しないフォルダが選ばれる可能性があるが、通常の運用では問題ない

## 承認

- [x] 実装は要件を満たしている
- [x] 既存機能を壊していない
- [x] verify がパスしている
- [x] 手動スモークテスト手順は網羅的

**Review Status: APPROVED**
