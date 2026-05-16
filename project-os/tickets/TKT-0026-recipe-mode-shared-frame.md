---
id: TKT-0026-recipe-mode-shared-frame
title: 献立・レシピ Mode B 共通フレーム化
status: implementation_ready
goal: Mode B のレシピ集・AI考案・スケジュールを食材管理と同じ共通フレーム構造へ揃え、ソートとリスト表示を安定させる
acceptance:
  - Mode B に レシピ集 / AI考案 / スケジュール の3タブがある
  - 3タブで Primary / Secondary / Select / List の構造が共通化される
  - 3タブでリスト開始位置が揃う
  - レシピ集に 登録日時 / 更新日時 / レシピ名 / 調理回数 / 材料数 のソートがある
  - AI考案タブは期限が近い食材をリスト表示し、既存AI生成フローを維持する
  - スケジュールは週ナビを共通フレーム内へ移動し、既存の追加・変更・削除導線を維持する
  - レシピ集シートに登録日時列を追加し、既存行は最終編集日時を表示上の登録日時として扱う
  - レシピ作成・更新・調理履歴更新のGAS列範囲が新スキーマに合っている
  - レシピ操作ごとの即時GAS通信を増やさない
  - verify がパスする
required_evals:
  - ui_component_addition
  - schema_migration
  - gas_pattern_change
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
  - SPEC-0026-recipe-mode-shared-frame
related_artifacts:
  - artifacts/TKT-0026/verify.json
  - artifacts/TKT-0026/manual-smokes.md
  - artifacts/TKT-0026/review.md
  - artifacts/TKT-0026/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - alert/confirm/prompt は使用しない
  - レシピUI操作ごとの即時GAS通信は追加しない
---

# Summary

Mode B の既存タブ内に散らばった操作領域を、食材管理と同じ行構造へ寄せる。レシピ集には登録日時列を追加し、ソート軸を拡張する。
