---
id: TKT-0040-activity-statusbar-blur-exclude
title: ステータスバーぼかし除外（z-index引上げ）
status: implementation_ready
goal: 全画面ぼかしオーバーレイ時に `#activityStatusBar` がぼかされないようにする
acceptance:
  - `#activityStatusBar` の z-index が `z-[90]` に変更されている
  - 初期同期画面、AI解析中、全モーダル表示時に `#activityStatusBar` がぼかされていない
  - 既存verifyが通る
required_evals:
  - ui_component_update
  - static_verify
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0040-activity-statusbar-blur-exclude.md
  - project-os/tickets/TKT-0040-activity-statusbar-blur-exclude.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0040-activity-statusbar-blur-exclude
related_artifacts:
  - artifacts/TKT-0040/verify.json
  - artifacts/TKT-0040/manual-smokes.md
  - artifacts/TKT-0040/review.md
  - artifacts/TKT-0040/report.md
owner_role: implementer
owner_notes:
  - 変更は z-index のみ。レイアウト・表示内容は一切変更しない。
  - ぼかし適用要素の最大 z-index は `#purchaseConfirmOverlay` の `z-[75]`
---

# Summary

`#activityStatusBar` の z-index を `z-[55]` から `z-[90]` に引き上げ、全画面ぼかしオーバーレイ群より前面に配置する。

## 調査結果

`#activityStatusBar` (z-[55]) は以下の要素より背面に位置し、`backdrop-filter` によるぼかしを受けていた：

| 要素 | z-index | backdrop-blur | 全画面 |
|---|---|---|---|
| `#processingOverlay` | z-[65] | あり | あり |
| `#purchaseConfirmOverlay` | z-[75] | あり | あり（動的） |
| `#recipeModal` | z-[60] | あり | あり |
| `#cookingRecordModal` | z-[60] | あり | あり |
| その他モーダル15個 | z-50 | あり | あり |

## 実装方針

`z-[55]` → `z-[90]` に変更。Toast（z-[80]）より前面になるが、ステータスバーは `pointer-events-none` で操作を奪わないため問題ない。
