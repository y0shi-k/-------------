---
id: TKT-0009-syncbar-modal-overlap
title: 未同期バーとモーダルの重なり回避
status: ready
goal: モーダル操作中に未同期バーが下部ボタンと重ならないようにする
acceptance:
  - 全8つのモーダル開閉で syncBar の表示/非表示が適切に切り替わる
  - モーダル開催中は syncBar が非表示
  - モーダル終了後は未同期件数に応じて syncBar が再表示される
required_evals:
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
  - SPEC-0009-syncbar-modal-overlap
related_artifacts:
  - artifacts/TKT-0009/verify.json
  - artifacts/TKT-0009/manual-smokes.md
  - artifacts/TKT-0009/review.md
  - artifacts/TKT-0009/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは変更なし（state.pendingSync + syncPendingChanges() のまま）
  - 変更範囲は app.html のみ
---

# Summary

syncBar（未同期バー）と各モーダルのボタンが重なる問題を解消する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要

## 残リスク

- 今後追加されるモーダルで同様の対応が必要になる可能性
