---
id: TKT-0029-background-activity-status
title: 写真取得中表示と下部ステータスバーを追加する
status: implementation_ready
goal: バックグラウンドで何を読み込んでいるか分からない状態を解消する
acceptance:
  - 写真未取得の履歴カードにスピナー付きの読み込み表示が出る
  - 画面下部に非ブロッキングの処理状況表示が出る
  - 写真取得完了時に履歴タブが自動更新される
  - 起動直後の写真先読みは遅延・アイドル実行のまま維持する
required_evals:
  - ui_component_addition
  - gas_pattern_change
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0029-background-activity-status.md
  - project-os/tickets/TKT-0029-background-activity-status.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0029-background-activity-status
related_artifacts:
  - artifacts/TKT-0029/verify.json
  - artifacts/TKT-0029/manual-smokes.md
  - artifacts/TKT-0029/review.md
  - artifacts/TKT-0029/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 下部ステータスは操作をブロックしない
---

# Summary

料理履歴写真の非同期取得とGAS処理の状況が分かるよう、写真枠内の読み込み表示と画面下部の処理状況バーを追加する。

## 実装メモ

- 既存の `executeGAS` と写真Base64取得処理に状況表示を接続する
- 既存の全画面オーバーレイは維持する
- バックグラウンド写真取得は `silent: true` のまま維持する

## 残リスク

- 実際の表示タイミングはCanvas環境で確認が必要。
