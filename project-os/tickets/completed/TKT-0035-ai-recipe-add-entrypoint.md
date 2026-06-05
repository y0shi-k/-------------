---
id: TKT-0035-ai-recipe-add-entrypoint
title: AI考案導線のレシピ追加統合
status: implementation_ready
goal: AI考案をレシピ集タブ内の追加アクションへ移し、レシピ追加導線を自然にまとめる
acceptance:
  - Mode B 上部タブから AI考案 が消え、レシピ集 / スケジュール の2タブになる
  - レシピ集Primary行に 新規レシピ / テキストから追加 / AI考案 が表示される
  - AI考案メニューから 優先消費レシピ と 指定食材から の既存AI生成フローに入れる
  - 期限食材の個別考案導線はAI考案メニュー内に最大数件表示される
  - GAS通信、schema、pendingSync は変更されない
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
  - SPEC-0035-ai-recipe-add-entrypoint
related_artifacts:
  - artifacts/TKT-0035/verify.json
  - artifacts/TKT-0035/manual-smokes.md
  - artifacts/TKT-0035/review.md
  - artifacts/TKT-0035/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - alert/confirm/prompt は使用しない
  - スプシ書き込み系の新規処理は追加しない
---

# Summary

Mode B のAI考案をレシピ集タブの追加アクションへ移動する。既存のAI生成、プレビュー、保存、同期キュー処理はそのまま再利用する。
