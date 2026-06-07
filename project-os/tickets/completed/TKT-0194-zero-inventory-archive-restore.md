---
id: TKT-0194-zero-inventory-archive-restore
title: 0在庫の非表示・復元履歴
status: implementation_ready
goal: 数量が0になった食材を通常一覧から非表示にし、直近履歴から数量を指定して戻せるようにする。
acceptance:
  - 数量が0になった在庫は通常一覧に表示されない
  - 0在庫はDBから即物理削除されず、復元用履歴に残る
  - 復元履歴は直近50件を基本に保持する
  - 履歴から数量を指定して在庫へ戻せる
  - 手動の数量マイナスで0になった場合に履歴へ移る
  - 調理完了の在庫減算で0になった場合に履歴へ移る
  - 復元履歴は本人のデータだけ読める・書けるRLS policyがある
  - Web版verify、manual smoke、reviewが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - supabase/migrations/
  - web/src/lib/inventory/types.ts
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/
  - project-os/artifacts/TKT-0194-zero-inventory-archive-restore/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0194-zero-inventory-archive-restore
related_artifacts:
  - artifacts/TKT-0194-zero-inventory-archive-restore/verify.json
  - artifacts/TKT-0194-zero-inventory-archive-restore/manual-smokes.md
  - artifacts/TKT-0194-zero-inventory-archive-restore/review.md
  - artifacts/TKT-0194-zero-inventory-archive-restore/report.md
owner_role: implementer
owner_notes:
  - 危険変更。Supabase schema とRLSを必ずreviewする。
  - 0在庫は完全削除しない。通常一覧から非表示にして復元可能にする。
  - 復元履歴の上限は50件を基本にする。実装方式は、既存参照と復元しやすさを確認してから決める。
  - 候補方式1: `inventory_items` に `archived_at` / `archived_reason` などを追加し、通常一覧は `archived_at is null` で絞る。
  - 候補方式2: `inventory_item_archives` のような履歴テーブルを追加し、0になった在庫を履歴へコピーして通常在庫からは除外する。
  - どちらの方式でも、本人以外が履歴を読めないRLS policyを必須にする。
  - 調理完了時の減算ロジックと、在庫一覧の `adjustInventoryQuantity` の両方を更新する。
  - verify は `/verify TKT-0194-zero-inventory-archive-restore`。manual smokeでは0化、非表示、復元、本人データ制限を確認する。
---

# Summary

0になった在庫を通常一覧から消し、直近履歴から戻せるようにする。データ保護に関わるため、schema/RLS変更として慎重に扱う。

## 実装メモ

- 対象:
  - `supabase/migrations/`
  - `web/src/lib/inventory/types.ts`
  - `web/src/components/inventory-board.tsx`
  - `web/src/components/recipe-meal-workspace.tsx`
- 0判定は分数対応後の端数丸めと矛盾しないようにする。TKT-0190後に実装するのが望ましい。
- テスト:
  - 手動マイナスで0
  - 調理完了で0
  - 通常一覧から非表示
  - 履歴から数量指定で復元
  - 50件上限

## 非対象

- 完全削除の取り消し
- AI画像解析
