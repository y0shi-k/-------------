---
id: TKT-0077-delete-confirmation-unification
title: 削除確認の統一追加
status: ready_for_user_browser_test
goal: 同期対象の永続データ削除で誤操作による即時削除を防ぐ
acceptance:
  - レシピ削除が確認モーダル経由になる
  - 在庫単体・在庫一括・買い物単体・買い物一括・献立一括削除が確認モーダル経由になる
  - 在庫数量を0にする削除も確認モーダル経由になる
  - 確定後は既存の pendingSync 削除キューに積まれ、個別GAS通信は増えない
required_evals:
  - html_parse
  - gas_entrypoint_presence
  - manual_bulk_sync_policy
  - destructive_action_confirmation
eval_selection_mode: manual
changed_paths:
  - app.html
  - project-os/specs/SPEC-0077-delete-confirmation-unification.md
  - project-os/tickets/TKT-0077-delete-confirmation-unification.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0077-delete-confirmation-unification
related_artifacts:
  - artifacts/TKT-0077/verify.txt
  - artifacts/TKT-0077/static-audit.md
  - artifacts/TKT-0077/manual-smokes.md
  - artifacts/TKT-0077/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 削除確定後も `state.pendingSync` + `syncPendingChanges()` の一括同期を維持する
  - `confirm()` / `alert()` / `prompt()` は追加しない
---

# Summary

レシピ集の削除確認漏れを起点に、同期対象の永続データ削除をカスタム確認モーダル経由へ統一する。

## 実装メモ

- 汎用削除確認モーダルを `app.html` に追加する。
- レシピ・在庫・買い物リスト・献立一括削除の入口を確認モーダル表示へ差し替える。
- 献立単体削除の既存専用モーダルは維持する。

## 残リスク

- Gemini Canvasでの実表示確認はユーザー実施。AIは静的確認と標準 verify を実施する。
