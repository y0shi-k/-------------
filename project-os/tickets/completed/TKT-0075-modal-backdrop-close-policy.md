---
id: TKT-0075-modal-backdrop-close-policy
title: モーダル外クリック制御の整理
status: ready_for_user_browser_test
goal: 入力中の内容や選択状態を、誤った画面外クリックで失わないようにする
acceptance:
  - `recipeModal` はレシピ追加・レシピ編集の両方で画面外クリックしても閉じない
  - 入力・選択フローのモーダルは画面外クリックで閉じない
  - 軽いメニュー・確認・閲覧系モーダルは画面外クリックで閉じる
  - `aiRecipePreviewModal` は `state._aiPreviewMode` が `generated` の時は閉じず、`viewing` の時は閉じる
required_evals:
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0075-modal-backdrop-close-policy.md
  - project-os/tickets/TKT-0075-modal-backdrop-close-policy.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0075-modal-backdrop-close-policy
related_artifacts:
  - artifacts/TKT-0075/verify.json
  - artifacts/TKT-0075/manual-smokes.md
  - artifacts/TKT-0075/review.md
  - artifacts/TKT-0075/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 保存・同期・GAS通信・Spreadsheet スキーマは変更しない
  - 閉じるボタン、キャンセル、保存など既存の明示的な操作は維持する
---

# Summary

`app.html` のモーダル背景クリック処理を整理し、入力破棄リスクのあるモーダルでは外側クリック close を無効化する。

## 実装メモ

- inline の `if(event.target===this) close...()` を共通関数に置き換える。
- 共通関数でモーダルIDと `state._aiPreviewMode` に基づき、外側クリックで閉じるか判定する。
- `executeGAS(payload...)` の新規個別書き込みは追加しない。

## 残リスク

- Canvas実機での視覚・タップ確認はユーザー手動確認が必要。
