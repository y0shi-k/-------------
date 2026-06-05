---
id: TKT-0049-cooking-viewer-return-route
title: 料理ビューアの戻り先保持
status: implementation_ready
goal: スケジュールやレシピ集から料理ビューアを開いた後、戻るボタンで起動元の画面に戻れるようにする
acceptance:
  - スケジュール画面から料理ビューアを開いた場合、戻るボタンでスケジュールタブへ戻る
  - レシピ集から料理ビューアを開いた場合、戻るボタンでレシピ集タブへ戻る
  - 料理履歴から「もう一度作る」を押した場合、戻るボタンで料理履歴へ戻る
  - 標準verifyがPASSする
required_evals:
  - ui_state_navigation
  - html_structure_verify
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
  - SPEC-0049-cooking-viewer-return-route
related_artifacts:
  - artifacts/TKT-0049/verify.json
  - artifacts/TKT-0049/manual-smokes.md
  - artifacts/TKT-0049/review.md
  - artifacts/TKT-0049/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - Spreadsheet/GAS/pendingSyncは変更しない
---

# Summary

料理ビューアを閉じた時の戻り先を、起動元画面ごとに復元する。データ更新を含まないUI状態変更として実装する。

## 実装メモ

- `state.cookingReturnContext` を追加する。
- `openCookingViewer(recipeId, options)` で戻り先を保存する。
- スケジュールとレシピ集の起動ボタンは明示的な戻り先を渡す。
- `closeCookingViewer()` で保存済みの戻り先へ復帰する。

## 残リスク

- Canvas上で実際の戻る操作確認が必要。
