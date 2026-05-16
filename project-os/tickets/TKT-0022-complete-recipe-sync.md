---
id: TKT-0022-complete-recipe-sync
title: 完了時一括更新GAS連携（献立・レシピ集・料理履歴の一括更新）
status: spec_ready
goal: 料理完了時に在庫減算・献立ステータス更新・レシピ集調理回数更新・料理履歴追加を一度のGAS通信で完了させる
acceptance:
  - GASペイロード `completeRecipe` が追加されている
  - ペイロードに recipeId / scheduleKey / cookingDate / rating / comment / photoUrl / inventoryUpdates / inventoryDeletes が含まれる
  - GAS側で以下が1回の呼び出し内で順次実行される:
    1. 在庫の更新・削除
    2. 献立スケジュールのステータスを「完了」に更新（該当予定があれば）
    3. レシピ集の調理回数+1、調理日履歴に今日の日付を追加
    4. 料理履歴シートへの新規行追加
  - 処理成功後、フロント側の state.inventory / state.schedule を最新状態に更新する
  - 処理成功後、showToast('料理が完了しました！') を表示する
  - 処理失敗時は showToast('保存に失敗しました。再度お試しください。') を表示する
  - 新規の個別 executeGAS 書き込みを増やさない
  - verify がパスする
required_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - docs/reports/MaginAgent GAS code.js（GAS側 completeRecipe ハンドラー追加）
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0022-complete-recipe-sync
related_artifacts:
  - artifacts/TKT-0022/verify.json
  - artifacts/TKT-0022/manual-smokes.md
  - artifacts/TKT-0022/review.md
  - artifacts/TKT-0022/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - completeRecipe 実行前に、pendingSync の在庫更新を空にしておく（completeRecipe 内で在庫更新も行うため重複を避ける）
  - GAS側で各ステップ後に SpreadsheetApp.flush() を実行
  - alert/confirm/prompt は使用しない
---

# Summary

料理完了時の一括更新GAS連携を実装する。在庫減算、献立ステータス更新、レシピ集調理回数更新、料理履歴追加を一度のGAS通信で完了させる。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: GASパターン変更 + 手動一括同期ポリシー

## 残リスク

- GAS側の処理が長くなりタイムアウト（30秒制限）にかかる可能性
  - 対策: 各シート更新を最小限にし、batchGet / batchUpdate を検討（ただし現時点では既存パターンの範囲で対応）
- 献立スケジュールに該当予定がない場合（直接レシピ集から料理した場合）のステータス更新はスキップされる
