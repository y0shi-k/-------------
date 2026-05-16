---
id: TKT-0024-spreadsheet-folder-and-last-edited-column
title: スプシ保存先をDriveフォルダに変更し、全シートに最終編集日時カラムを追加
status: implementation_ready
goal: GDrive直下に「料理レシピ・食材管理_Canvasアプリ」フォルダを作成し、その中にスプシと写真を保存。全5シートに「最終編集日時」カラムを追加し、追加・更新時に自動で日時をセットする。
acceptance:
  - handleInit() でスプシ作成時にフォルダを作成/取得し、スプシをフォルダ内に移動する
  - syncPendingChanges() で写真をフォルダ内に保存する（DriveApp.createFile + moveTo）
  - 全5シートのヘッダーに「最終編集日時」を追加
  - 全シートの追加・更新・購入処理で最終編集日時を自動セット
  - 既存の読み出し処理が新しい列構成でも正しく動作する
  - verify がパスする
required_evals:
  - gas_pattern_change
  - schema_migration
  - folder_structure
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0024-spreadsheet-folder-and-last-edited-column
related_artifacts:
  - artifacts/TKT-0024/verify.json
  - artifacts/TKT-0024/manual-smokes.md
  - artifacts/TKT-0024/review.md
  - artifacts/TKT-0024/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 新規スプシ・新規フォルダ作成前提（既存データマイグレーションは不要）
  - alert/confirm/prompt は使用しない
---

# Summary

GDrive直下に「料理レシピ・食材管理_Canvasアプリ」フォルダを作成し、スプシと写真をその中に保存する。また、全5シートに「最終編集日時」カラムを追加し、データの追加・更新時に自動で現在日時をセットする。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- stack 固有 eval: GASパターン変更 + スキーマ移行 + フォルダ構造

## 変更範囲

### handleInit()
- フォルダ作成/取得（`DriveApp.getFoldersByName` / `DriveApp.createFolder`）
- スプシ作成後に `file.moveTo(folder)` でフォルダ内に移動
- 全5シートのヘッダーに「最終編集日時」を追加

### syncPendingChanges()
- フォルダ取得（`DriveApp.getFoldersByName`）
- `var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');` を定義
- 各種書き込み処理に `now` を追加：
  - 食材在庫: 12列目
  - レシピ集: 8列目
  - 献立スケジュール: 6列目
  - 料理履歴: 8列目
  - 買い物リスト: 10列目
- 写真保存時に `file.moveTo(folder)` を実行
- `ensureSheetColumns` のヘッダー配列も更新

## 残リスク

- 既存スプシが存在する環境では、新規スプシが別IDで作成される（仕様通り）
- 既存フォルダが存在する場合はそのフォルダを使用する
