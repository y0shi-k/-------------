---
id: TKT-0012-shopping-manual-shortage-check
title: 買い物リスト手動追加の在庫差分化
status: ready
goal: 手動で買い物リストへ追加する数量を、在庫で足りない分だけにする
acceptance:
  - 同じ品名+単位の在庫合計を差し引いた不足分だけ追加される
  - 在庫で足りる場合は追加されず、トーストで知らせる
  - 書き込み系の即時GAS通信が増えない
  - verify がパスする
required_evals:
  - manual_bulk_sync_policy
  - ui_component_adjustment
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
  - SPEC-0012-shopping-manual-shortage-check
related_artifacts:
  - artifacts/TKT-0012/verify.json
  - artifacts/TKT-0012/manual-smokes.md
  - artifacts/TKT-0012/review.md
  - artifacts/TKT-0012/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 手動追加は state.pendingSync.shoppingCreates 経由のまま
---

# Summary

買い物リストの手動追加フォームで、入力数量から現在在庫を差し引き、不足分だけを未同期の買い物リスト行として追加する。
