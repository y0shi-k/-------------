---
id: TKT-0028-cooking-history-base64-photo-preview
title: 料理履歴写真をGAS Base64取得で表示する
status: implementation_ready
goal: Drive閲覧URLを `<img>` に入れても写真が表示されない問題を、共有設定を変えずに解消する
acceptance:
  - 料理履歴タブでDrive写真URLからBase64画像を取得してサムネイル表示する
  - Base64取得は読み取り専用で、Spreadsheet書き込みやDrive共有変更を行わない
  - 取得済み画像は `state.cookingHistoryImageCache` を使って再利用する
  - 取得失敗時は「写真を開く」リンクを残す
  - 標準verifyが通る
required_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0028-cooking-history-base64-photo-preview.md
  - project-os/tickets/TKT-0028-cooking-history-base64-photo-preview.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0028-cooking-history-base64-photo-preview
related_artifacts:
  - artifacts/TKT-0028/verify.json
  - artifacts/TKT-0028/manual-smokes.md
  - artifacts/TKT-0028/review.md
  - artifacts/TKT-0028/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 今回追加するGAS通信は写真Blob読み取り専用。書き込み系は増やさない。
  - Drive共有設定変更は禁止。
---

# Summary

料理履歴のDrive写真URLをGASでBase64に変換して返し、Canvas内で安定してサムネイル表示できるようにする。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- 読み取り専用GAS通信は既存の `executeGAS` を使う
- 書き込み系処理は `state.pendingSync` + `syncPendingChanges()` に限定する

## 残リスク

- 大量の写真を一度にBase64取得すると重くなるため、画面描画後に未取得分を小分けで読み込む。
