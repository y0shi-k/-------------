---
id: TKT-0078-today-dashboard
title: 今日やることダッシュボード
status: implementation_ready
goal: 起動直後に、今日の献立・期限食材・買い物・未同期・料理開始の優先行動を判断できるようにする
acceptance:
  - 今日の献立、期限が近い食材、買い物件数、未同期件数、作る候補が同一画面で確認できる
  - 今日の未完了献立から直接クッキングビューアを開ける
  - 期限食材カードから食材管理または優先消費レシピ導線へ遷移できる
  - 買い物カードからモードAの買い物リストへ遷移できる
  - 未同期件数は既存の `state.pendingSync` と同期バー表示に矛盾しない
  - 空状態、今日の献立なし、期限食材なし、買い物なし、未同期なしの各ケースで表示が崩れない
required_evals:
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0078-today-dashboard.md
  - project-os/tickets/TKT-0078-today-dashboard.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0078-today-dashboard
related_artifacts:
  - artifacts/TKT-0078/verify.json
  - artifacts/TKT-0078/manual-smokes.md
  - artifacts/TKT-0078/review.md
  - artifacts/TKT-0078/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 第一候補は既存3モード維持で、モードC通常表示または起動後トップに「今日」セクションを追加する
  - Spreadsheetスキーマ、GAS通信、`syncPendingChanges()` は変更しない
  - 既存関数の遷移を再利用し、ダッシュボード独自の保存処理は作らない
---

# Summary

日常利用の入口として「今日やること」ダッシュボードを実装する。既存データの派生表示に留め、最初の実装では保存形式を増やさない。

## 実装メモ

1. `getTodayDashboardData()` のような派生集計関数を追加する。
2. 今日の献立、期限食材、買い物、未同期、候補レシピをそれぞれ小さなカードで表示する。
3. 各カードは既存の `switchMode`, `filterByLocation`, `openCookingViewer`, `openRecipeViewer` などへ接続する。
4. 期限食材の候補抽出は `実質期限 || 表示期限` を使い、期限切れ、3日以内、7日以内の順で優先する。
5. 空状態では説明文を増やしすぎず、主要アクションだけ表示する。

## 残リスク

- どこを初期表示にするかで既存ユーザーの導線が変わる。実装時にボトムナビ4項目化は慎重に判断する。
