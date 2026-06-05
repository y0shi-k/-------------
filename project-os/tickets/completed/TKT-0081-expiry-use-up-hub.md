---
id: TKT-0081-expiry-use-up-hub
title: 期限食材と使い切り導線
status: implementation_ready
goal: 期限が近い食材を見つけるだけでなく、既存レシピ検索やAI優先消費提案へつなげて使い切りやすくする
acceptance:
  - 期限切れ、3日以内、7日以内の食材が専用セクションで一覧できる
  - 食材カードに数量、保存場所、期限種別、期限日、残日数、開封状態が表示される
  - 食材カードから該当食材でレシピ検索できる
  - 食材カードからAI優先消費レシピ導線へ移動できる
  - 今日ダッシュボードには上位の期限食材が要約表示される
  - 期限対象0件、期限未設定のみ、期限切れ多数のケースで表示が崩れない
required_evals:
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0081-expiry-use-up-hub.md
  - project-os/tickets/TKT-0081-expiry-use-up-hub.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0081-expiry-use-up-hub
related_artifacts:
  - artifacts/TKT-0081/verify.json
  - artifacts/TKT-0081/manual-smokes.md
  - artifacts/TKT-0081/review.md
  - artifacts/TKT-0081/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 期限計算は既存の `実質期限 || 表示期限` を使う
  - 既存のAI優先消費レシピ導線を再利用し、新規AI通信パターンは増やさない
  - SpreadsheetスキーマとGAS通信は変更しない
---

# Summary

期限が近い食材を専用表示し、既存レシピ検索とAI優先消費提案へ接続する。食品ロス削減を日常導線に組み込む。

## 実装メモ

1. `getExpiringInventoryGroups()` のような派生関数を追加する。
2. 食材管理または今日ダッシュボードに使い切りセクションを追加する。
3. 「この食材で探す」はレシピ検索モードを食材検索へ切り替え、検索語をセットしてモードBへ遷移する。
4. 「AIで使い切り」は既存の優先消費/指定食材AIフローに対象食材を渡す。
5. 期限未設定食材は警告ではなく補助的に表示し、期限切れ/近い食材を優先する。

## 残リスク

- 品名の完全一致だけではレシピ検索のヒット率が低い可能性がある。必要なら同義語/部分一致は別ticketで扱う。
