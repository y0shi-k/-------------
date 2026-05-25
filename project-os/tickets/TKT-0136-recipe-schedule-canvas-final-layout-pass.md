---
id: TKT-0136-recipe-schedule-canvas-final-layout-pass
title: 献立・レシピCanvas最終レイアウト寄せ
status: ready
goal: 献立・レシピをCanvas画像7/8/9のレシピ集と週間スケジュールに近い画面へ整理する
acceptance:
  - レシピ集はCanvas画像7のように検索、条件チップ、並び替え、レシピカード一覧が主役になる
  - `+ 新規レシピ` はCanvas画像4の編集モーダル入口になり、通常画面に大きな編集フォームを常時表示しない
  - `テキストから追加` と `AI考案` はCanvas画像5/6のモーダル導線に近い
  - スケジュールはCanvas画像8/9のように7日、朝昼晩、追加ボタン、今日強調が見える
  - 画面切替時に横幅、余白、下部ナビ位置が大きくずれない
  - AI APIの秘密情報をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0136/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_done
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0136/verify.json
  - artifacts/TKT-0136/browser-smoke.md
  - artifacts/TKT-0136/review.md
  - artifacts/TKT-0136/report.md
owner_role: implementer
owner_notes:
  - TKT-0135完了後に実施する
  - 添付画像4/5/6/7/8/9を基準にする
  - 既存のレシピ保存、AI生成、献立追加、買い物リスト処理は壊さない
  - 通常画面は一覧とスケジュールを優先し、編集系はモーダルに逃がす
---

# Summary

献立・レシピの最終見た目調整チケット。現在はフォーム中心で、Canvasのレシピカード一覧と週間スケジュール中心の体験からずれている。

