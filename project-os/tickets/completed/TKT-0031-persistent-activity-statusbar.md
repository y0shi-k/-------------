---
id: TKT-0031-persistent-activity-statusbar
title: 常設ステータス領域と手動同期の非ブロッキング化
status: implementation_ready
goal: ステータス表示時のレイアウトズレと手動同期中の操作不能を解消する
acceptance:
  - 最下部に1行のステータスバー領域が常時確保される
  - 写真読み込みや同期開始時に画面・ボトムナビ・リスト位置がズレない
  - 手動同期中、全画面オーバーレイが出ず画面操作できる
  - 手動同期中の二重同期が防止される
required_evals:
  - ui_component_update
  - gas_pattern_change
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0031-persistent-activity-statusbar.md
  - project-os/tickets/TKT-0031-persistent-activity-statusbar.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0031-persistent-activity-statusbar
related_artifacts:
  - artifacts/TKT-0031/verify.json
  - artifacts/TKT-0031/manual-smokes.md
  - artifacts/TKT-0031/review.md
  - artifacts/TKT-0031/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 手動同期は `syncPendingChanges()` 経由のまま、通信中だけ非ブロッキングにする
---

# Summary

TKT-0029のステータスバーを常設の最下部1行領域に変更し、表示切替によるズレを防ぐ。スプレッドシートへの手動同期は二重実行だけを防ぎ、同期中も他の画面操作は継続できるようにする。

## 実装メモ

- `#activityStatusBar` は非表示にせず、idle / busy / done の表示状態だけを切り替える
- `#bottomNav` と `main#app` はステータスバー領域を前提に固定余白を持つ
- `executeGAS()` に `nonBlocking` を追加し、手動同期だけで使う

## 残リスク

- Canvas実機でのsafe-area表示は手動確認が必要
