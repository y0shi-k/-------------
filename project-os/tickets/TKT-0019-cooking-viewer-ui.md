---
id: TKT-0019-cooking-viewer-ui
title: モードC UI基盤（大画面クッキングビューア）
status: implementation_ready
goal: 料理中に遠くからでも読める大画面UIを構築し、献立やレシピ集からの導線を整える
acceptance:
  - モードCに切り替えるとクッキングビューアが表示される
  - 献立スケジュールの割り当て済みスロットに「▶ 開始」ボタンがあり、タップでビューアが開く
  - レシピ集カードに「料理する」導線がある（三点リーダーメニューまたはボタン）
  - 材料が `text-xl` 程度の大きなフォントで表示される
  - 食材は緑系バッジ、調味料は黄系バッジで視覚的に区別される
  - 「大さじ」は赤系バッジ＋太字、「小さじ」は青系バッジ＋太字で表示される
  - 手順テキスト内の分量表現（例: 「醤油 大さじ1」）が強調表示される
  - 画面下部に「料理を完了する」ボタンがあり、タップで消費量調整モーダルへ遷移する
  - verify がパスする
required_evals:
  - ui_component_addition
  - manual_smokes_done
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
  - SPEC-0019-cooking-viewer-ui
related_artifacts:
  - artifacts/TKT-0019/verify.json
  - artifacts/TKT-0019/manual-smokes.md
  - artifacts/TKT-0019/review.md
  - artifacts/TKT-0019/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - alert/confirm/prompt は使用しない
  - 新規モーダルは既存の hidden クラス切替パターンに従う
  - 材料JSON・手順JSONのパース失敗時は showToast で保護
---

# Summary

モードCの大画面クッキングビューアを新規実装する。レシピの材料と手順を大きな文字と色分けバッジで表示し、献立スケジュールおよびレシピ集からの導線を整える。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント追加
- スプシ変更を含まないため `manual_bulk_sync_policy` は不要

## 残リスク

- 手順テキスト内の分量パターン（正規表現）が日本語の表現揺れに対応しきれない可能性
- レシピの材料JSONに分類情報（食材／調味料）がない場合、デフォルトで「食材」扱いとする
