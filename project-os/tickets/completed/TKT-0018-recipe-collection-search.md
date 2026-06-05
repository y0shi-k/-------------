---
id: TKT-0018
title: レシピ集に検索フィルタを追加
status: implementation_ready
goal: レシピが増えた際に目的のレシピを素早く見つけられるようにする
acceptance:
  - レシピ集画面に検索UI（セグメントボタン＋テキスト入力）が追加される
  - 検索対象を「レシピ名」「食材」「すべて」から選択できる
  - テキスト入力でリアルタイムにフィルタリングされる
  - 検索結果0件時に「該当するレシピが見つかりません」と表示される
  - 既存機能（新規レシピ、テキスト追加、編集、削除、閲覧）が壊れない
  - スプシ通信なし（クライアント側フィルタのみ）
required_evals:
  - manual_bulk_sync_policy
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
  - SPEC-0018
related_artifacts:
  - artifacts/TKT-0018/verify.json
  - artifacts/TKT-0018/manual-smokes.md
  - artifacts/TKT-0018/review.md
  - artifacts/TKT-0018/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ通信なしのため、pendingSync 積みは不要
  - 既存パターン（scheduleRecipeSearch、aiIngredientSearch、renderScheduleRecipePickerList）を踏襲する
  - alert/confirm/prompt は使用しない
  - showToast は本機能では不要（リアルタイム絞り込みのみ）
---

# Summary

レシピ集（#bTabRecipes）に検索フィルタを追加する。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント追加
- スプシ変更を含まないため、pendingSync や syncPendingChanges() は不要

## 残リスク

- レシピ名または食材名に特殊文字や全角文字が含まれる場合の検索動作（toLowerCase でカバー）
- 大量レシピ（数百件以上）でのリアルタイムフィルタ性能（state.recipes のメモリフィルタなので現状は問題なし）
