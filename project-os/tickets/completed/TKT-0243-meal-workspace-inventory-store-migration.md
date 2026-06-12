---
id: TKT-0243-meal-workspace-inventory-store-migration
title: 献立側の在庫参照と調理完了フローを共有在庫ストアへ移行し、在庫一覧へ即時反映する
status: completed
goal: 献立スケジュールから調理完了（在庫減算）した後、在庫一覧に戻ってもリロードまで反映されない不具合（本イニシアチブの発端）を解消する
acceptance:
  - recipe-meal-workspace.tsx の inventoryItemsForMeals（useState 複製）を共有在庫ストア参照に置き換える。TKT-0239 で入れた「ダイアログオープン時の最小リフェッチ」はストアの refetch に統合する
  - 調理完了（消費確定）・ロールバック（rollbackCompletedSchedule L1874 付近）・完了スケジュール削除（deleteCompletedSchedule L1919 付近）・補充（setVisibleConsumptionAmount L1158 付近）の在庫更新が共有ストアに反映され、在庫一覧タブへ切り替えるとリロードなしで最新数量が表示される
  - cooking-record-edit-modal.tsx の差分計算（previousQuantity）は「書き込み時点の在庫」を基準にし、古い在庫と fresh の混在による誤更新を起こさない（learnings の TKT-0239 節の注意を遵守。全参照を差し替えられない場合は当該箇所の方針を report に記す）
  - 調理完了→在庫減算→共有ストア反映の流れを単体テストで検証する（Supabase クライアントをモック）
  - 既存の献立・消費系テストが全て pass する
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/components/inventory-store.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0242-shared-inventory-store
related_artifacts:
  - artifacts/TKT-0243-meal-workspace-inventory-store-migration/verify.json
  - artifacts/TKT-0243-meal-workspace-inventory-store-migration/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0243`（= `harness/bin/verify_web.sh`）
  - diff に inventory_items / meal_schedules / cooking_history トークンが入るため danger eval が過剰マッチしうるが、schema/policy/auth 無変更。report に明記する
  - 必須成果物は verify.json + report.md（非危険変更）
---

# Summary

イニシアチブ「在庫データの全画面即時反映」の T2。TKT-0242 で新設した共有在庫ストアへ献立側を移行する。
本チケット完了時点で、ユーザー報告の「調理完了→在庫一覧に戻っても減っていない」が解消されること。

## 実装メモ

- 参照すべき既存ファイル:
  - `web/src/components/inventory-store.tsx`（TKT-0242 の成果物）… 公開 API（state/setter/refetch）に従う
  - `web/src/components/recipe-meal-workspace.tsx` … inventoryItemsForMeals の全参照箇所（setInventoryItemsForMeals は L1793/L1900/L2482 付近ほか）を grep で列挙してから着手
  - `web/src/components/cooking-record-edit-modal.tsx` … saveRecord()（L159 付近）が直接 Supabase 更新後 onSaved() を呼ぶ。onSaved 側（workspace L2601 付近）は router.refresh() のみなのでストア更新に置き換える
  - `project-os/tickets/completed/TKT-0239-consumption-dialog-inventory-refetch.md` と learnings 同日節 … 差分計算の誤更新リスクの注意書き
- 完了直後にタブを切り替えた場合でも反映されるよう、ストア更新は await 完了後ではなく楽観的更新＋失敗時 refetch のどちらかに方針を決め、report に記す
- GAS/Spreadsheet/Drive 不使用、APIキー直書き禁止、RLS 変更なし

## 非ゴール

- 買い物リスト追加・レシピ保存・履歴ボードの経路整理（TKT-0244）
- 献立スケジュールやレシピ自体の共有ストア化（在庫データのみが対象）

## 依存チケット

- TKT-0242（共有在庫ストア基盤）

## 残リスク

- recipe-meal-workspace.tsx は巨大（2600行超）で在庫参照が散在する。置き換え漏れは「一部操作だけ古い」形で現れるため、grep による全列挙と acceptance のテストで担保する
