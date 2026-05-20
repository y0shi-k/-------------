---
id: TKT-0070-schedule-slot-header-add-button
title: スケジュール食事枠ヘッダー追加ボタン
status: implementation_ready
goal: スケジュールの各食事枠で下部の大きな追加ボタンを廃止し、ヘッダー右側の小型追加ボタンに置き換える
acceptance:
  - 各スロット下部の横長 dashed 追加ボタンが表示されない
  - 朝・昼・晩のヘッダー行右側に小型の追加ボタンが表示される
  - 小型追加ボタンから既存のレシピ選択モーダルが開く
  - 空スロット、レシピありスロット、選択モードONでレイアウトが崩れない
  - verify がパスする
required_evals:
  - ui_component_update
eval_selection_mode: auto
changed_paths:
  - AGENTS.md
  - app.html
  - project-os/specs/SPEC-0070-schedule-slot-header-add-button.md
  - project-os/tickets/TKT-0070-schedule-slot-header-add-button.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0070-schedule-slot-header-add-button
related_artifacts:
  - artifacts/TKT-0070/verify.json
  - artifacts/TKT-0070/manual-smokes.md
  - artifacts/TKT-0070/review.md
  - artifacts/TKT-0070/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは変更しない
  - TKT-0069 の今日中心7日表示変更を維持する
  - ブラウザ実表示テストはユーザーが実施する
---

# Summary

スケジュール画面の朝・昼・晩スロットで、カード下部に出る大きな `＋` ボタンを削除し、食事名ヘッダー行の右側に小型 `＋` ボタンを配置する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント調整
- スプシ変更は含まないため `manual_bulk_sync_policy` は不要
- ブラウザ実表示テストはユーザー実施

## 残リスク

- GeminiCanvas 実機でのタップ領域と見た目はユーザー確認が必要
