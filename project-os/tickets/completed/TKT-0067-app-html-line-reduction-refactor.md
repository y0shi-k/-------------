---
id: TKT-0067-app-html-line-reduction-refactor
title: app.html 行数削減リファクタ
status: implementation_ready
goal: 新規機能を追加せず、既存のパース・空表示・レシピ編集フォーム描画の重複を減らして app.html を保守しやすくする
acceptance:
  - 既存の `parseJsonArray()` / レシピ部品ヘルパを使い、フロント側レシピ配列の直接 `JSON.parse(... || '[]')` が減っている
  - 空状態HTMLが `emptyStateHtml()` に集約され、表示文言とスタイルが既存と同等に保たれる
  - レシピ編集モーダルの材料・調味料・下ごしらえ・調理工程入力行が共通テンプレートで描画される
  - `openAiRecipePreview()` と `openRecipeViewer()` のプレビューリスト描画が共通ヘルパを使う
  - GAS通信方式、Spreadsheetスキーマ、pendingSync一括同期モデルを変更しない
  - verify と追加JS構文チェックがパスする
required_evals:
  - ui_component_addition
  - canvas_constraint
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
  - SPEC-0067-app-html-line-reduction-refactor
related_artifacts:
  - artifacts/TKT-0067/verify.json
  - artifacts/TKT-0067/manual-smokes.md
  - artifacts/TKT-0067/review.md
  - artifacts/TKT-0067/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 追加で `<script>` 抽出後の JS 構文チェックを行う
  - alert/confirm/prompt を追加しない
  - `executeGAS()` / GASペイロード / Spreadsheet書き込み処理は変更しない
---

# Summary

単一HTML制約を維持したまま、既存の共通関数を使い切れていない箇所と、レシピ表示・編集フォームの重複HTMLを整理する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- 初回スコープは低リスクの重複削減に限定し、汎用カードレンダラ化は別フェーズに残す

## 残リスク

- レシピ編集モーダルのHTMLテンプレート集約はDOM構造に触れるため、Canvasプレビューで代表操作の確認が必要
