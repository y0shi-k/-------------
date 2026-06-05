---
id: TKT-0079-cook-candidate-queue
title: 作りたい候補キュー
status: implementation_ready
goal: 日付未定の「近いうちに作りたい」レシピを一時管理し、献立割り当てへつなげる
acceptance:
  - レシピカードから候補へ追加/解除できる
  - 候補一覧から「献立に入れる」「料理する」「外す」ができる
  - 候補には手動/期限食材/AI提案/履歴由来などの理由が表示できる
  - 候補から日付・朝昼晩スロットへ割り当てられる
  - 永続化を伴う場合は `state.pendingSync` に積み、`syncPendingChanges()` 以外の個別書き込み通信を増やさない
  - 候補0件時に、レシピ集・期限食材・AI提案へ移動する導線がある
required_evals:
  - ui_component_addition
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0079-cook-candidate-queue.md
  - project-os/tickets/TKT-0079-cook-candidate-queue.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0079-cook-candidate-queue
related_artifacts:
  - artifacts/TKT-0079/verify.json
  - artifacts/TKT-0079/manual-smokes.md
  - artifacts/TKT-0079/review.md
  - artifacts/TKT-0079/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 実装前に候補の保存先を確定する。原則はスキーマ変更なし
  - 永続化が既存シートに自然に載らない場合、MVPはローカル派生表示に留め、保存対応は別ticket化する
  - 保存を伴う場合は `manual_bulk_sync_policy` を必ず満たす
---

# Summary

献立に入れる前の中間置き場として、作りたい候補キューを実装する。日付未定の料理候補を保持し、今日ダッシュボードや献立スケジュールへ接続する。

## 実装メモ

1. 保存方式を先に決める。スキーマ変更なしで既存データに自然に載せられるかを確認する。
2. レシピカードに候補追加/解除の小さなアクションを追加する。
3. 候補一覧コンポーネントを作り、理由、前回調理日、期限食材根拠を表示する。
4. 候補カードから既存のスケジュール追加モーダルへ遷移する。
5. 候補から料理開始する場合は既存の `openCookingViewer` を使う。

## 残リスク

- 既存Spreadsheetスキーマに候補状態を自然に保存できない可能性がある。その場合は永続化を無理に詰め込まず、別途スキーマ検討ticketに分離する。
