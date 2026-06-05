---
id: TKT-0072-schedule-controls-spacing
title: スケジュール操作欄の余白圧縮
status: implementation_ready
goal: スケジュール画面の選択モード下に残る不要な空白と「7日分」行を削除し、同期説明文を操作行右端へ移動する
acceptance:
  - 選択モード行からスケジュール一覧までの不要な固定余白が削除される
  - スケジュール画面に「7日分」文言が表示されない
  - 「同期は上部の同期ボタンで一括反映」が選択モード行の右端に表示される
  - 選択モードOFF、選択モードON、1件以上選択時に操作欄が崩れない
  - 標準verifyがPASSする
required_evals:
  - ui_component_update
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0072-schedule-controls-spacing.md
  - project-os/tickets/TKT-0072-schedule-controls-spacing.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0072-schedule-controls-spacing
related_artifacts:
  - artifacts/TKT-0072/verify.json
  - artifacts/TKT-0072/manual-smokes.md
  - artifacts/TKT-0072/review.md
  - artifacts/TKT-0072/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更、GAS通信変更、pendingSync変更は含めない
  - ブラウザ実表示テストはユーザーが実施する
---

# Summary

Mode B スケジュール画面の操作欄を詰め、選択モード行の直下にスケジュール一覧が続くようにする。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要
- ブラウザ実表示テストはユーザー実施

## 残リスク

- GeminiCanvas 実機での余白量と横幅不足時の見え方はユーザー確認が必要
