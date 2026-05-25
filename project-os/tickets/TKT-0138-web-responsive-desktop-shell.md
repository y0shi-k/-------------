---
id: TKT-0138-web-responsive-desktop-shell
title: 食材管理Canvas完全再現レイアウト
status: ready_for_user_browser_test
goal: 独自改善を入れず、Web版の食材管理画面をCanvas版画像と同じ構造・色・密度へ近づける
acceptance:
  - PC幅でも上部3モードナビを表示しない
  - PC幅でもCanvas版と同じく下部ナビで食材管理、献立・レシピ、料理・記録を切り替える
  - 食材管理のタイトル、右側タブ、保存場所タブ、並び順、すべて選択、在庫行がCanvas版画像に近い
  - 在庫行は数量ステッパー、編集アイコン、削除アイコンを持つ
  - 食材管理で編集、削除、選択、すべて選択、選択解除、数量変更が動く
  - 買い物リスト、登録待ちモーダル、写真AI解析の入口が崩れない
  - APIキー、写真URL、Service Role Keyをブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/web-mode-shell.test.tsx
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0138/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_pending_user
  - review_ready
  - report_ready
related_specs:
  - SPEC-0138-web-responsive-desktop-shell
related_artifacts:
  - artifacts/TKT-0138/verify.json
  - artifacts/TKT-0138/browser-smoke.md
  - artifacts/TKT-0138/review.md
  - artifacts/TKT-0138/report.md
owner_role: implementer
owner_notes:
  - 独自のPC向けアレンジや改善を入れない
  - Canvas版画像を正とし、Web版の都合で別レイアウトにしない
  - Supabase保存処理、AI解析API、写真Storage処理は変更しない
---

# Summary

Web版の食材管理がCanvas版と別物に見える問題を直す。

PC向けに広げるのではなく、Canvas版と同じ中央アプリ幅、下部ナビ、横長在庫行へ寄せる。
