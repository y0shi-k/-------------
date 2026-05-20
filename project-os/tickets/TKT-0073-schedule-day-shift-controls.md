---
id: TKT-0073-schedule-day-shift-controls
title: スケジュール7日表示の日送り操作
status: implementation_ready
goal: スケジュールの今日中心7日表示を、上下矢印で1日ずつ前後へずらせるようにする
acceptance:
  - 初期表示は今日を中央にした 今日-3日 から 今日+3日 の7日分である
  - 7日リスト上の上矢印で表示範囲が1日過去へ戻る
  - 7日リスト下の下矢印で表示範囲が1日未来へ進む
  - 日送り後の前の週 / 次の週は、現在の表示位置から7日単位で移動する
  - 今週ボタンで今日中心の7日表示へ戻る
  - レシピ詳細からスケジュール追加後、追加した予定日を含む7日表示へ移動する
  - 選択モード、選択削除、D&D、スケジュール追加ボタンの既存挙動が維持される
  - verify がパスする
required_evals:
  - ui_component_update
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0073-schedule-day-shift-controls.md
  - project-os/tickets/TKT-0073-schedule-day-shift-controls.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0073-schedule-day-shift-controls
related_artifacts:
  - artifacts/TKT-0073/verify.json
  - artifacts/TKT-0073/manual-smokes.md
  - artifacts/TKT-0073/review.md
  - artifacts/TKT-0073/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更、GAS通信変更、pendingSync変更は含めない
  - 下矢印は未来方向、上矢印は過去方向
  - ブラウザ実表示テストはユーザーが実施する
---

# Summary

Mode B スケジュール画面の7日リスト上下に日送りボタンを追加し、前後週ボタンを日送り済みの現在位置から7日単位で移動する挙動へ変更する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要

## 残リスク

- GeminiCanvas 実機での上下ボタンのタップ感と余白はユーザー確認が必要
