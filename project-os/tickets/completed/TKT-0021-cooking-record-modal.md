---
id: TKT-0021-cooking-record-modal
title: 記録モーダル（写真アップロード・評価・感想）
status: spec_ready
goal: 料理後に完成写真・星評価・感想を記録し、後から振り返りできるようにする
acceptance:
  - 消費量調整確定後に「料理の記録」モーダルが自動で開く
  - 写真をカメラ撮影または画像選択でアップロードできる
  - 選択後にプレビュー画像が表示される
  - ★1〜5の星評価をタップで選択できる（初期値は未選択）
  - 感想を複数行テキスト入力できる（任意）
  - 「記録を保存」ボタンで completeRecipe フロー（TKT-0022）へ進む
  - 画像未選択・評価未入力でも保存できる
  - 画像アップロード失敗時はトースト警告を出し、記録保存を継続可能にする
  - verify がパスする
required_evals:
  - ui_component_addition
  - gas_pattern_change
eval_selection_mode: auto
changed_paths:
  - app.html
  - docs/reports/MaginAgent GAS code.js（GAS側に saveImageToDrive 追加が必要な場合）
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0021-cooking-record-modal
related_artifacts:
  - artifacts/TKT-0021/verify.json
  - artifacts/TKT-0021/manual-smokes.md
  - artifacts/TKT-0021/review.md
  - artifacts/TKT-0021/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 画像は FileReader で Base64 に変換し、GAS の saveImageToDrive で Drive に保存する
  - Base64 サイズが大きい場合（5MB超）は Canvas でリサイズ（最大1024px）してから変換
  - alert/confirm/prompt は使用しない
---

# Summary

料理後の記録モーダルを実装する。完成写真のアップロード、星評価、感想入力を行い、次の completeRecipe 一括更新へ繋ぐ。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: UIコンポーネント追加 + GASパターン変更

## 残リスク

- 大きな画像ファイルのBase64変換でメモリ圧迫・処理遅延の可能性（リサイズで緩和）
- Canvas環境での FileReader / Canvas API の互換性
