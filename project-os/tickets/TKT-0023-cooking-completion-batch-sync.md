---
id: TKT-0023-cooking-completion-batch-sync
title: 料理完了フローを手動一括同期経路に統合（画像アップロード含む）
status: implementation_ready
goal: 料理完了後の全更新（在庫減算・献立ステータス更新・レシピ集調理回数更新・料理履歴追加・画像Drive保存）をpendingSyncに積み、syncPendingChanges()の手動一括同期でまとめて反映する
acceptance:
  - completeRecipe から即時 executeGAS を削除
  - pendingSync に cookingHistory キューを追加（各要素に photoBase64, photoFilename を含む）
  - saveCookingRecord で画像アップロード即時実行を停止（Base64を保持するだけ）
  - confirmConsumption で在庫更新・削除を積んだままにする（completeRecipe でクリアしない）
  - syncPendingChanges() のGASペイロードを拡張して以下を処理:
    - cookingHistory: 各項目の photoBase64 をDriveに保存→URL取得→料理履歴シートに書き込み
    - scheduleUpdates: 献立スケジュールのステータス更新（date + meal で特定）
    - recipeHistory: レシピ集の調理回数+1・履歴日付追加（recipeId で特定）
  - 処理成功後、showToast('料理が完了しました！同期するまでスプシ未反映です。') を表示
  - 失敗時は showToast('保存に失敗しました。再度お試しください。') を表示
  - verify がパスする
required_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - docs/reports/MaginAgent GAS code.js（syncPendingChanges GASペイロード拡張）
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0023-cooking-completion-batch-sync
related_artifacts:
  - artifacts/TKT-0023/verify.json
  - artifacts/TKT-0023/manual-smokes.md
  - artifacts/TKT-0023/review.md
  - artifacts/TKT-0023/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 画像アップロードも含めた一括同期で、Base64サイズが大きい場合のPOST制限に注意
  - alert/confirm/prompt は使用しない
---

# Summary

料理完了時の全更新（在庫・献立・レシピ・履歴・画像）を、即時GAS通信から手動一括同期経路（syncPendingChanges）に移行する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- stack 固有 eval: GASパターン変更 + 手動一括同期ポリシー

## 残リスク

- Base64画像データを含めた一括同期で、POSTサイズ制限に達する可能性（リサイズ済みで1画像あたり通常200KB〜1MB）
- 画像アップロード失敗時は photoUrl 空文字で記録継続
