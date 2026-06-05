---
id: TKT-0010-syncbar-top-statusbar
title: 未同期バーの上部ステータスバー化
status: ready
goal: 未同期バーが下部ボタンと重ならないように、上部ステータスバーへ移行する
acceptance:
  - syncBar が画面上部に表示される
  - 表示/非表示でコンテンツが上下にずれない（pt-14 でスペース確保）
  - 下部の一括削除ボタン・モーダルボタンと一切重ならない
  - モーダル開催中は未同期バーが隠れる（TKT-0009 の機能維持）
  - verify がパスする
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
  - SPEC-0010-syncbar-top-statusbar
related_tickets:
  - TKT-0009-syncbar-modal-overlap
related_artifacts:
  - artifacts/TKT-0010/verify.json
  - artifacts/TKT-0010/manual-smokes.md
  - artifacts/TKT-0010/review.md
  - artifacts/TKT-0010/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは変更なし（state.pendingSync + syncPendingChanges() のまま）
  - 変更範囲は app.html のみ
  - TKT-0009 で追加したモーダル連動制御も同時に更新する
---

# Summary

未同期バー（#syncBar）を画面上部のステータスバーへ移行し、下部ボタンとの重なりを根本的に解消する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要

## 残リスク

- 上部ステータスバーが既存の #statusBar（プログレスバー）と視覚的に混同される可能性
- 対応: #statusBar は処理中表示で通常時は非表示、syncBar は未同期時のみ表示なので同時表示は稀
