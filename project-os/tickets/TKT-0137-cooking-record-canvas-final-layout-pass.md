---
id: TKT-0137-cooking-record-canvas-final-layout-pass
title: 料理・記録Canvas最終レイアウト寄せ
status: completed
goal: 料理・記録をCanvas画像1/2/3のサマリー、カレンダー、タイムライン、振り返りに近い画面へ整理する
acceptance:
  - 上部にCanvas画像1/2/3のような今月、今週、写真あり、よく作るのサマリーが出る
  - `カレンダー`、`タイムライン`、`振り返り` のタブ表示がCanvas画像に近い
  - カレンダーは月表示、日付セル、凡例、日別履歴カードがCanvas画像2に近い
  - タイムラインは検索、フィルタ、日付グループ、履歴カードがCanvas画像3に近い
  - 振り返りは最近作った、評価が高い、しばらく作っていない、ジャンル傾向、写真一覧がCanvas画像1に近い
  - 料理履歴の追加フォームは通常画面を圧迫しない
  - 写真は非公開Storage方針を維持し、署名付きURL以外を露出しない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/cooking-history-board.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - web/src/__tests__/cooking-history-board.test.tsx
  - project-os/artifacts/TKT-0137/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_done
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0137/verify.json
  - artifacts/TKT-0137/browser-smoke.md
  - artifacts/TKT-0137/review.md
  - artifacts/TKT-0137/report.md
owner_role: implementer
owner_notes:
  - TKT-0136完了後に実施する
  - 添付画像1/2/3を基準にする
  - 既存の料理履歴保存、写真保存、履歴検索は壊さない
  - データが0件のテストアカウントでもCanvas構造が分かる空状態を用意する
  - 2026-05-26: 実装完了。lint/typecheck/test/build通過。Browser tool未提供のため自動スクショはpartial。
---

# Summary

料理・記録の最終見た目調整チケット。現在は記録フォーム中心で、Canvasのサマリー、カレンダー、タイムライン、振り返り中心の画面とはまだ差がある。
