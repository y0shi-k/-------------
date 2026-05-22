---
id: TKT-0080-recipe-card-decision-signals
title: レシピカードの意思決定情報強化
status: implementation_ready
goal: レシピ一覧で、写真・前回調理日・評価・期限食材一致などを見て作る料理を選びやすくする
acceptance:
  - レシピカードに前回調理日、調理回数、評価サマリー、期限食材一致、写真有無のうち既存データから派生できる情報が表示される
  - 写真付き履歴があるレシピはカード上で視覚的に判別できる
  - バッジは最大数を制御し、小画面でレシピ名や操作ボタンと重ならない
  - レシピビューア上部にも主要メタが表示される
  - 履歴なし、写真なし、評価なし、ジャンルなしでもカードが崩れない
required_evals:
  - ui_component_addition
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0080-recipe-card-decision-signals.md
  - project-os/tickets/TKT-0080-recipe-card-decision-signals.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0080-recipe-card-decision-signals
related_artifacts:
  - artifacts/TKT-0080/verify.json
  - artifacts/TKT-0080/manual-smokes.md
  - artifacts/TKT-0080/review.md
  - artifacts/TKT-0080/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 既存のレシピ保存形式、料理履歴保存形式、GAS通信は変更しない
  - 写真は既存の料理履歴写真取得キャッシュ/関数を再利用する
  - カード密度が上がるため、モバイル幅の視認性を重点確認する
---

# Summary

レシピカードに、作る判断に効く派生情報を追加する。既存データから算出できる情報に限定し、保存形式を増やさない。

## 実装メモ

1. `getRecipeDecisionMeta(recipe)` のような派生関数を追加する。
2. 料理履歴から最新写真、最新調理日、評価サマリーを取得する。
3. 在庫から期限が近い食材を抽出し、レシピ材料との一致をバッジ化する。
4. レシピカードの左側を写真/アイコン兼用領域にし、既存アクションは押しやすいサイズを維持する。
5. 情報量が多い場合は優先順位を付け、カード内バッジを最大2〜3件に抑える。

## 残リスク

- Drive写真の読み込み遅延によりカード表示が重くなる可能性がある。必要なら遅延読み込みまたは表示件数制限を入れる。
