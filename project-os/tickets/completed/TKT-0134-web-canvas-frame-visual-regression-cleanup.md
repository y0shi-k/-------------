---
id: TKT-0134-web-canvas-frame-visual-regression-cleanup
title: Web版Canvasフレーム表示崩れ修正
status: ready_for_user_browser_test
goal: ブラウザ実確認で見つかった共通フレームのCanvas差分を先に解消し、各画面の再現確認をしやすくする
acceptance:
  - 各モードで大見出しと英字ラベルが二重表示されない
  - ログイン後の通常画面に `Web版の準備状況` が表示されない
  - 下部3ナビ、上部ステータス、中央カラム幅はCanvas画像に近いまま維持される
  - スマホ幅で下部ナビが本文を隠しすぎない
  - 既存のログイン、RLS、保存処理を変更しない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0134/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_done
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0134/verify.json
  - artifacts/TKT-0134/browser-smoke.md
  - artifacts/TKT-0134/review.md
  - artifacts/TKT-0134/report.md
owner_role: implementer
owner_notes:
  - ブラウザ実確認で見つかった最優先の共通差分
  - 実装前に `project-os/knowledge/canvas-parity-matrix.md` と `project-os/knowledge/canvas-ui-workflows.md` を参照する
  - 添付画像11/12/7/8/1の共通構造を基準にする
  - ここでは画面内部のフォーム再配置には踏み込まない
---

# Summary

Canvas再現の土台を整えるチケット。現在はモード見出しが二重に出ており、さらに開発進捗カードが通常画面へ露出しているため、Canvas画像との比較がしにくい。

# Implementation Notes

- `SetupStatus` をログイン後の通常画面から外した。
- 各モード内の重複見出しは視覚表示から外し、Shell側の見出しだけを見せる形にした。
- ブラウザ実確認はユーザー指示待ち。
