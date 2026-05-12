---
id: TKT-0000-example
title: 実装タスクのタイトル
status: draft
goal: 何を防ぐための変更か
acceptance:
  - 完了条件1
required_evals:
  - example_eval
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
  - SPEC-0000-example
related_artifacts:
  - artifacts/TKT-0000-example/verify.json
  - artifacts/TKT-0000-example/manual-smokes.md
  - artifacts/TKT-0000-example/review.md
  - artifacts/TKT-0000-example/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 任意監査は現時点では未定
---

# Summary

`required_evals` は `harness/change_evals.json` の `match_rules` と変更範囲を根拠に決める。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: スキーマ変更、GAS通信パターン改変、UIコンポーネント追加、フェーズ移行

## 残リスク
