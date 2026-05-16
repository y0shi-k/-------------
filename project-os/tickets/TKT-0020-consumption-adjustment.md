---
id: TKT-0020-consumption-adjustment
title: 料理完了フロー（消費量調整モーダル＋在庫減算）
status: implementation_ready
goal: 料理完了時に実際の消費量を調整し、その分だけ在庫を減算できるようにする
acceptance:
  - クッキングビューアに「料理を完了する」ボタンがある
  - ボタン押下で消費量調整モーダルが開く
  - モーダル内で各材料の規定量が表示され、実際の消費量を数値入力できる
  - 初期値は規定量と同じ
  - 0または未入力の材料は在庫減算対象外になる
  - 負数は入力不可（min="0"）
  - 在庫数量を超える消費量の場合、警告トーストが出て確定ボタンが無効化される
  - 「確定」ボタンで在庫減算が state.pendingSync に積まれる（個別GAS通信を増やさない）
  - 確定後、記録モーダル（TKT-0021）が自動で開く
  - verify がパスする
required_evals:
  - ui_component_addition
  - manual_bulk_sync_policy
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
  - SPEC-0020-consumption-adjustment
related_artifacts:
  - artifacts/TKT-0020/verify.json
  - artifacts/TKT-0020/manual-smokes.md
  - artifacts/TKT-0020/review.md
  - artifacts/TKT-0020/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 在庫減算は state.pendingSync.inventoryUpdates / inventoryDeletes に積む
  - 同名・同単位の在庫アイテムを state.inventory から検索して減算する
  - alert/confirm/prompt は使用しない
---

# Summary

料理完了時の消費量調整モーダルを実装し、調整後の数量を在庫から減算して pendingSync に積む。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント追加 + 手動一括同期ポリシー

## 残リスク

- レシピの材料名と在庫の品名が完全一致しない場合（例: 「玉ねぎ」vs「玉葱」）のマッチング精度
- 複数の同品名在庫が存在する場合の減算対象選択（現状は最初にヒットした1件から減算）
