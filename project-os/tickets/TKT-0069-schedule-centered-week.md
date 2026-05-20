---
id: TKT-0069-schedule-centered-week
title: スケジュール今日中心7日表示
status: ready_for_user_browser_test
goal: スケジュール画面を今日中心の7日表示にし、今週ボタンで今日中心へ戻せるようにしつつ、今日と土日の視認性を上げる
acceptance:
  - scheduleWeekOffset が 0 のとき、今日を中央にした 今日-3日 から 今日+3日 の7日が表示される
  - 前の週 / 次の週で表示範囲が7日ずつ移動する
  - 中央の今週ボタンを押すと今日中心の7日表示へ戻る
  - レシピ詳細からスケジュール追加後、追加日が含まれる7日表示へ移動する
  - 今日の日付カードが土日色より優先して強調される
  - 土曜日は青系、日曜日は赤系で表示される
  - verify がパスする
required_evals:
  - ui_component_update
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0069-schedule-centered-week.md
  - project-os/tickets/TKT-0069-schedule-centered-week.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0069-schedule-centered-week
related_artifacts:
  - artifacts/TKT-0069/verify.json
  - artifacts/TKT-0069/manual-smokes.md
  - artifacts/TKT-0069/review.md
  - artifacts/TKT-0069/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは変更しない
  - `toISOString()` 由来の日付ずれを避けるため、ローカル日付で YYYY-MM-DD を生成する
---

# Summary

スケジュール画面の7日表示を、曜日固定ではなく今日中心へ変更する。中央の今週表示はクリック可能なリセットボタンにし、今日・土曜・日曜の日付カード色を分ける。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要

## 残リスク

- GeminiCanvas 実機での色味とタップ感は手動確認が必要
