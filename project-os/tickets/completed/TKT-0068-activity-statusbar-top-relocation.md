---
id: TKT-0068-activity-statusbar-top-relocation
title: 常設ステータスバーと同期バーの上部入れ替え
status: ready_for_user_browser_test
goal: GeminiCanvas 更新後に最上部のボタンが押せない不具合を避けるため、押下不要の常設ステータスバーを最上部へ置き、同期ボタン付きバーをその直下へ下げる
acceptance:
  - activityStatusBar が画面最上部に固定表示される
  - activityStatusBar は pointer-events-none を維持し、押下対象にならない
  - syncBar が activityStatusBar の直下に表示され、破棄/同期するボタンが最上部のクリック不能領域から外れる
  - activityStatusBar の内容幅が現状より少し広い
  - bottomNav が activityStatusBar 分だけ上に押し上げられない
  - main#app の上余白が新しい固定バー配置に合わせて調整される
  - verify がパスする
required_evals:
  - ui_component_update
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0068-activity-statusbar-top-relocation.md
  - project-os/tickets/TKT-0068-activity-statusbar-top-relocation.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0068-activity-statusbar-top-relocation
related_artifacts:
  - artifacts/TKT-0068/verify.json
  - artifacts/TKT-0068/manual-smokes.md
  - artifacts/TKT-0068/review.md
  - artifacts/TKT-0068/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは変更しない
  - `activityStatusBar` は常設表示のまま、idle / busy / done の表示状態だけを切り替える
  - `pointer-events-none` を維持し、最上部固定後も操作を奪わない
  - `syncBar` の同期ボタンは `activityStatusBar` の直下に配置する
---

# Summary

GeminiCanvas の更新後、画面最上部にクリックできない領域ができている。押下不要の常設ステータスバーを最上部へ置き、押下が必要な同期バーをその直下へ下げる。あわせてステータス文言の表示幅を少し広げる。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要
- `#activityStatusBar` を `top-0` に固定する
- `#syncBar` を `--activity-status-height` 分だけ下げ、同期ボタンが最上部のクリック不能領域に入らないようにする
- `#bottomNav` の `bottom` 計算から `--activity-status-height` を外す
- `#app` の下余白から `--activity-status-height` を外し、上余白側へ反映する
- `#activityStatusBar` の内容幅を `max-w-2xl` から少し広い値へ変更する

## 残リスク

- GeminiCanvas 実機上の固定レイヤー挙動は手動確認が必要
