---
id: TKT-0034-saas-ui-cleanup
title: SaaSライクUIクリーンアップ
status: implementation_ready
goal: 機能を変えずに、過剰装飾と絵文字を抑えたモダンでクリーンなUIへ整える
acceptance:
  - `app.html` の機能、イベント属性、GAS通信経路が維持される
  - `font-black`、過剰角丸、`border-2`、強いshadowが残っていない
  - UI絵文字がinline SVGへ置換され、評価の星は維持される
  - 標準 verify が成功し、artifact に結果が残る
required_evals:
  - ui_component_update
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
  - SPEC-0034-saas-ui-cleanup
related_artifacts:
  - artifacts/TKT-0034/verify.json
  - artifacts/TKT-0034/manual-smokes.md
  - artifacts/TKT-0034/review.md
  - artifacts/TKT-0034/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - `<script>` 内テンプレート文字列は表示HTMLのみ変更し、JSロジックは変更しない
  - スプシ書き込み系の新規処理は追加しない
---

# Summary

`app.html` の見た目だけを整理し、太字・角丸・影・絵文字を控えめなSaaSライク表現へ変更する。

## 実装メモ

- `font-black` は使わず、主に `font-medium` と `font-bold` にする
- `rounded-2xl` 以上の角丸は `rounded-xl` に下げる
- `border-2` は `border` に下げ、入力欄の視認性は `focus:ring-2` で補う
- 絵文字は inline SVG に置換する

## 残リスク

- Gemini Canvas 上の実表示は手動プレビューで最終確認が必要
