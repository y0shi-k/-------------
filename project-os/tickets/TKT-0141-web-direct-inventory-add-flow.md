---
id: TKT-0141-web-direct-inventory-add-flow
title: Web版 食材追加フロー整理
status: ready_for_implementation
goal: Web版の食材追加を、登録待ちを挟まず在庫へ直接追加する流れへ整理する
acceptance:
  - 食材管理右上のプラスから「画像スキャン」「手動で追加」を選べる
  - 手動追加は inventory_items に直接保存される
  - 写真AI解析は候補確認後、選択した候補だけ inventory_items に保存される
  - 新しいWeb版UIでは登録待ちリスト、在庫へ確定、一括登録待ち削除を表示しない
  - APIキー、写真URL、Service Role Keyをブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - photo_upload_storage
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/lib/ai/ingredient-scan.ts
  - web/src/components/web-mode-shell.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - web/src/__tests__/inventory-board.test.tsx
  - web/src/__tests__/scan-ingredients-route.test.ts
  - project-os/specs/SPEC-0141-web-direct-inventory-add-flow.md
  - project-os/artifacts/TKT-0141/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - review_ready
  - report_ready
related_specs:
  - SPEC-0141-web-direct-inventory-add-flow
related_artifacts: []
owner_role: implementer
owner_notes:
  - Canvas版 app.html は変更しない
  - staging_items テーブルは過去データ互換のため削除しない
  - 写真解析結果は自動保存ではなくユーザー確認後に保存する
---

# Summary

Web版の食材追加導線を、登録待ち中心から直接在庫追加へ切り替える。
