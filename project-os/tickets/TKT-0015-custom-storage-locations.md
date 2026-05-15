---
id: TKT-0015-custom-storage-locations
title: 在庫保存場所タブのユーザー管理
status: ready
goal: 在庫管理画面の保存場所タブをユーザーが追加・編集できるようにし、固定タブ運用をなくす
acceptance:
  - 保存場所タブが動的に描画される
  - 保存場所管理モーダルで名前変更・統合・空候補削除ができる
  - 食材追加/編集モーダルから新しい保存場所を追加できる
  - 保存場所の在庫更新は pendingSync に積まれ、個別GAS書き込みを増やさない
  - verify がパスする
required_evals:
  - standard_verify
  - manual_bulk_sync_policy
  - ui_smoke
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0015-custom-storage-locations.md
  - project-os/tickets/TKT-0015-custom-storage-locations.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0015-custom-storage-locations
related_artifacts:
  - artifacts/TKT-0015/verify.json
  - artifacts/TKT-0015/manual-smokes.md
  - artifacts/TKT-0015/review.md
  - artifacts/TKT-0015/report.md
owner_role: implementer
owner_notes:
  - スプレッドシートのスキーマ変更は禁止
  - 保存場所変更は在庫更新として `queueInventoryUpdate()` に積む
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
---

# Summary

在庫画面上部の保存場所タブを固定HTMLから動的生成へ変更し、タブ末尾の管理モーダルで保存場所を整理できるようにする。

## 実装メモ

- `すべて`、`登録待ち`、`買い物リスト` はシステムタブとして編集不可
- 未使用の追加候補はセッション内だけ保持し、食材に割り当てられた保存場所は在庫データから復元する
- 新規UIは `alert` / `confirm` / `prompt` を使わない

## 残リスク

- 未使用候補はリロードで消えるため、必要なら食材に一度割り当てる必要がある
