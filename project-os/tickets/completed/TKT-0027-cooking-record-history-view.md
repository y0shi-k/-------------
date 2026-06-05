---
id: TKT-0027-cooking-record-history-view
title: 料理・記録画面にレシピ確認タブと料理履歴タブを追加する
status: implementation_ready
goal: 保存済みの料理履歴をアプリ上で確認できず、料理前のレシピ確認導線にも戻りづらい状態を解消する
acceptance:
  - モードC通常表示が「レシピ確認」「料理履歴」の2タブになる
  - 料理履歴シートを初期同期と一括同期後に読み込み、`state.cookingHistory` へ反映する
  - 履歴カードに写真、調理日、レシピ名、星評価、感想抜粋、「もう一度作る」を表示する
  - 写真URLが画像として読み込めない場合は「写真を開く」リンクへフォールバックする
  - 履歴一覧をレシピ名、評価、写真有無で絞り込める
  - 新規の個別 `executeGAS(payload...)` 書き込み通信を追加しない
required_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
  - ui_component_addition
  - phase_transition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0027-cooking-record-history-view.md
  - project-os/tickets/TKT-0027-cooking-record-history-view.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0027-cooking-record-history-view
related_artifacts:
  - artifacts/TKT-0027/verify.json
  - artifacts/TKT-0027/manual-smokes.md
  - artifacts/TKT-0027/review.md
  - artifacts/TKT-0027/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 料理履歴の読み取りは初期同期と `syncPendingChanges()` 成功後の返却データに含める
  - 書き込み系処理は増やさず、既存の `pendingSync.cookingHistory` と `syncPendingChanges()` を維持する
---

# Summary

`app.html` のモードC通常表示をタブ化し、料理前のレシピ確認導線と、保存済み料理履歴のカード一覧を追加する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: GAS通信パターン、スプシ手動一括同期、UIコンポーネント追加、フェーズ移行
- 既存スキーマは変更しない
- スプシ書き込みは `state.pendingSync` + `syncPendingChanges()` のまま維持する

## 残リスク

- DriveのプレビューURLは `<img>` 表示できない場合があるため、リンクフォールバックで扱う
