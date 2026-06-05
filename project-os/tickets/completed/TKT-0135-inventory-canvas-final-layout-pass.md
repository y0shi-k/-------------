---
id: TKT-0135-inventory-canvas-final-layout-pass
title: 食材管理Canvas最終レイアウト寄せ
status: ready_for_user_browser_test
goal: 食材管理をCanvas画像11/12に近い、在庫一覧と買い物リスト中心の画面へ整理する
acceptance:
  - 初期表示はCanvas画像12のように保存場所タブ、並び替え、選択、在庫カードが主役になる
  - `食材を追加` はCanvas画像10のようなモーダル入口になり、通常画面に大きな入力フォームを常時表示しない
  - `買い物リスト` はCanvas画像11の空状態と操作配置に近い
  - 期限切れ、期限間近、通常在庫の色と密度がCanvas画像に近い
  - スマホ幅でも在庫カードの数量操作、編集、削除が押しやすい
  - APIキー、写真URL、Service Role Keyをブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0135/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - browser_visual_smoke_done
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0135/verify.json
  - artifacts/TKT-0135/browser-smoke.md
  - artifacts/TKT-0135/review.md
  - artifacts/TKT-0135/report.md
owner_role: implementer
owner_notes:
  - TKT-0134完了後に実施する
  - 添付画像10/11/12を基準にする
  - 既存の在庫追加、登録待ち、写真解析、買い物リスト処理は壊さない
  - 大きなフォームは削除ではなく、必要な導線から開ける形に移す
---

# Summary

食材管理の最終見た目調整チケット。現在は機能フォームが前面に出すぎており、Canvasの「一覧を見て操作する」画面とは印象が違う。

# Implementation Notes

- 初期表示を在庫一覧中心に変更した。
- `+` から登録待ち・手動追加・写真解析をモーダルで開くようにした。
- 買い物リスト表示時は買い物リスト画面に集中するようにした。
- ブラウザ実確認はユーザー指示待ち。
