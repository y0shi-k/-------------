---
id: TKT-0043-cooking-viewer-layout-polish
title: 料理中レシピビューアの2カラム化と材料チップ強調
status: completed
goal: 料理中に材料と手順を同時に確認でき、手順文中の材料・調味料・分量を見つけやすくする
acceptance:
  - 料理ビューアが左に材料、右に手順の2カラム表示になる
  - 狭い画面では材料と手順が縦に並び、表示が破綻しない
  - 材料・調味料がグループ別に表示される
  - レシピ編集で材料・調味料のグループと並び順を編集できる
  - 手順文中の材料名・調味料名・大さじ・小さじがチップ表示される
  - 材料チップを押すと左の該当材料がハイライトされる
  - 既存レシピの `{name, amount, unit}` 形式が後方互換で表示される
  - 個別の即時GAS書き込みを追加しない
  - verify がパスする
required_evals:
  - html_structure_verify
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
  - SPEC-0043-cooking-viewer-layout-polish
related_artifacts:
  - artifacts/TKT-0043/verify.json
  - artifacts/TKT-0043/manual-smokes.md
  - artifacts/TKT-0043/review.md
  - artifacts/TKT-0043/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプレッドシート列は追加しない。TKT-0042で追加済みの調味料JSON・下ごしらえJSON列は維持する
  - 料理ビューア内の新しい材料メタデータは `ingredients` / `seasonings` JSON内の `type` / `group` / `order` に保存する
---

# Summary

料理ビューアを材料・手順の同時参照に最適化し、レシピ追加/編集時に材料グループと順序を管理できるようにした。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- `syncPendingChanges()` 以外の個別GAS書き込みは追加しない

## 残リスク

- 手順文のチップ化は登録済み材料名・調味料名と大さじ/小さじ表現の照合ベースであり、自然言語の完全解析ではない
- Canvas実機でのレスポンシブ見た目は手動smoke対象
