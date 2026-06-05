---
id: TKT-0060-recipe-genre-shopping-shortage-select
title: レシピジャンルタグと買い物候補選択モーダル
status: ready
goal: レシピをジャンルで整理できるようにし、献立追加時の買い物リスト自動追加をユーザー選択式にする
acceptance:
  - レシピ追加/編集で複数ジャンルタグを選択・追加・削除できる
  - ジャンルタグ配列はレシピ集シートの `ジャンル` 列に同期される
  - スケジュール追加時の不足候補モーダルでALL/食材/調味料を切り替えられる
  - 初期チェックは全件オフで、選択した候補だけ買い物リストへ追加される
required_evals:
  - ui_component_addition
  - schema_change
  - manual_bulk_sync_policy
  - gas_pattern_change
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0060-recipe-genre-shopping-shortage-select.md
  - project-os/tickets/TKT-0060-recipe-genre-shopping-shortage-select.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0060-recipe-genre-shopping-shortage-select
related_artifacts:
  - artifacts/TKT-0060/verify.json
  - artifacts/TKT-0060/manual-smokes.md
  - artifacts/TKT-0060/review.md
  - artifacts/TKT-0060/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 書き込み系は `state.pendingSync` に積み、`syncPendingChanges()` 以外で個別書き込み通信しない
---

# Summary

`app.html` にレシピジャンルタグの保存・候補表示と、スケジュール追加時の不足材料選択モーダルを実装する。

## 実装メモ

- ジャンル列は既存レシピ集列の後続列として追加し、JSON配列文字列を保存する。
- ジャンル候補は初期候補と既存レシピのタグから生成し、候補外は編集欄の入力で直接追加する。
- 不足候補モーダルの確定時のみ既存の `addShortagesToShopping()` を呼ぶ。

## 残リスク

- 候補外ジャンルは、そのタグを持つレシピが保存されるまで候補一覧には残らない。
