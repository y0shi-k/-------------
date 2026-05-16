---
id: TKT-0032-location-tab-count-badges
title: 保存場所タブに件数バッジを表示
status: implementation_ready
goal: 食材管理画面の保存場所タブに、各場所の在庫件数をバッジで表示する
acceptance:
  - 「すべて」タブに総在庫件数が表示される
  - 各保存場所タブに該当場所の在庫件数が表示される
  - アクティブ/非アクティブ状態でバッジの色が切り替わる
  - 件数0でも「0」と表示される
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
related_artifacts:
  - artifacts/TKT-0032/verify.json
  - artifacts/TKT-0032/manual-smokes.md
  - artifacts/TKT-0032/review.md
  - artifacts/TKT-0032/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - renderInventoryPrimaryRow() の既存パターンを再利用し、各タボタン内に件数バッジを追加
---

# Summary

食材管理画面（モードA）の保存場所選択タブ（すべて / 冷蔵庫 / 冷凍庫 ...）に、各場所に紐づく在庫件数をバッジで表示する。

## 実装メモ

- `renderInventoryPrimaryRow()` で各タブ生成時に `state.inventory` をフィルタリングして件数を算出
- バッジスタイル: `text-[10px] font-black px-1.5 py-0.5 rounded-full`
- アクティブ時: `bg-indigo-100 text-indigo-700`
- 非アクティブ時: `bg-white/60 text-slate-500`
- 既存の `getLocationTabClass()` は変更せず、バッジ色は呼び出し側で分岐

## 残リスク

- 在庫件数が多い（3桁以上）の場合、タブ幅がやや広がる可能性あり（実用上問題なし）
