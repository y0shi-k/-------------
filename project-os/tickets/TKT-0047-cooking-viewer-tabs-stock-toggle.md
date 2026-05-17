---
id: TKT-0047-cooking-viewer-tabs-stock-toggle
title: 料理ビューアーの在庫チェック切替とカテゴリタブ追加
status: completed
goal: 料理中ビューアの一覧性を高め、必要な時だけ在庫有無を確認できるようにする
acceptance:
  - 左ペインにALL/材料/調味料タブが追加される
  - 右ペインに下ごしらえ/調理工程タブが追加される
  - 材料ペインの件数表示の右に在庫チェックトグルが追加される
  - 料理ビューアを開いた直後は在庫チェックOFFかつALLタブで、材料・調味料は1列の1行コンパクト表示になる
  - 在庫チェックONでは現状同等の在庫あり/不足を含む2行表示になる
  - 空カテゴリや旧形式レシピでも表示が破綻しない
  - 個別の即時GAS書き込みを追加しない
  - verify がパスする
required_evals:
  - html_structure_verify
  - ui_component_addition
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
  - SPEC-0047-cooking-viewer-tabs-stock-toggle
related_artifacts:
  - artifacts/TKT-0047/verify.json
  - artifacts/TKT-0047/manual-smokes.md
  - artifacts/TKT-0047/review.md
  - artifacts/TKT-0047/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプレッドシート列、GAS通信、pendingSync、料理完了、在庫消費調整は変更しない
---

# Summary

料理ビューアーにカテゴリタブと在庫チェックトグルを追加する。データ更新は発生しないUI変更として実装する。
