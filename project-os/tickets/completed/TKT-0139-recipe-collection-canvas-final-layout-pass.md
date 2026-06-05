---
id: TKT-0139-recipe-collection-canvas-final-layout-pass
title: 献立・レシピ画面 Canvas完全再現レイアウト
status: ready_for_user_browser_test
goal: Web版の献立・レシピ画面をCanvas版スクショと同じ構造・色・密度へ近づける
acceptance:
  - Canvas版スクショを正として、独自改善やPC向けアレンジを入れない
  - app.html のモードB実装を確認してからWeb版へ反映する
  - レシピ集タブ、追加ボタン群、検索/絞り込み、並び替え、件数、レシピ一覧カードがCanvas版に近い
  - レシピ一覧は薄青コンテナ内の横長カードとして表示する
  - 既存の新規作成、テキスト追加、AI考案、編集、削除、調理開始の処理を壊さない
  - スケジュール画面、下部ナビ、Supabase/API処理を壊さない
  - APIキー、写真URL、Service Role Keyをブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/tickets/TKT-0139-recipe-collection-canvas-final-layout-pass.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_pending_user
  - review_ready
  - report_ready
related_specs:
  - SPEC-0119-recipe-collection-canvas-parity
related_artifacts:
  - artifacts/TKT-0139/report.md
  - artifacts/TKT-0139/verify.json
owner_role: implementer
owner_notes:
  - Canvas版画像を正とし、Web版の都合で別レイアウトにしない
  - Supabase保存処理、AI解析API、写真Storage処理は変更しない
---

# Summary

Web版の献立・レシピ画面がCanvas版より大きな管理カード中心に見える問題を直す。

Canvas版と同じく、一覧操作を主役にした中央1カラム、横長レシピカード一覧、下部ナビ前提の画面へ寄せる。
