---
id: TKT-0242-shared-inventory-store-foundation
title: 共有在庫ストア（Context）を新設し、InventoryBoard の在庫 state 複製を撤廃する
status: completed
goal: 3ボード（在庫/献立/履歴）が server props を各自 useState(initialXxx) に複製しているため、mutation が他ボードに反映されずリロードが必要になる構造問題の土台を解消する
acceptance:
  - 在庫データ（inventory_items の現役/アーカイブ、storage_locations）の単一ソースとなる共有ストア Context（Provider + hook、新規ファイル）を実装し、web-mode-shell.tsx 配下で全ボードから参照できる
  - ストアは「state + 楽観的更新用の setter + Supabase からの refetch 関数」を公開する。refetch の select・並び順・整形は page.tsx の初回フェッチと不整合を起こさない
  - inventory-board.tsx の useState(initialInventoryItems) / useState(initialArchivedInventoryItems) / useState(initialStorageLocations) を共有ストア参照に置き換え、在庫の追加・編集・消費・アーカイブ等の既存 mutation がストア経由で更新される
  - 在庫一覧の既存表示・操作（フィルタ・並び替え・編集・消費）に回帰がない（既存テストが全て pass）
  - 共有ストアの更新が参照側に伝播することを単体テストで検証する（最低1ケース）
  - 状態更新は immutable パターンを維持する（既存規約どおり）
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/inventory-store.tsx
  - web/src/app/page.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0242-shared-inventory-store
related_artifacts:
  - artifacts/TKT-0242-shared-inventory-store-foundation/verify.json
  - artifacts/TKT-0242-shared-inventory-store-foundation/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0242`（= `harness/bin/verify_web.sh`）
  - diff に `inventory_items` トークンが入るため `supabase_schema_change` / `auth_and_rls_policy` が match_rules 上過剰マッチしうるが、クライアント側の state 再構成のみで schema/policy/auth 無変更。過去運用（TKT-0239 ほか）どおり report に「実schema無変更」を明記する
  - 必須成果物は verify.json + report.md（非危険変更）
---

# Summary

イニシアチブ「在庫データの全画面即時反映（共有ストア化）」の土台チケット（T1）。
3ボードは web-mode-shell.tsx で常時マウント（hidden切替・266c477）されており、各自が server props を
useState に複製するため mutation が兄弟ボードへ伝わらない（learnings 2026-06-12 TKT-0239 の節を参照）。
本チケットでストアを新設し、まず InventoryBoard を移行する。献立側の移行は TKT-0243。

## 実装メモ

- 参照すべき既存ファイル:
  - `web/src/app/page.tsx` … 初回フェッチ（select・整形の正本。ストアの refetch はこれと揃える）
  - `web/src/components/web-mode-shell.tsx` … 既存 Context（ShellSubViewContext 等）のパターンに合わせて Provider を追加
  - `web/src/components/inventory-board.tsx` … L241 付近の useState(initialXxx) 群が撤廃対象
  - `project-os/knowledge/learnings.md` 2026-06-12「常時マウントの兄弟ボードは…」… 背景と判断基準
- ストアの初期値は page.tsx から渡る initial props を使い、初回の追加フェッチは発生させない
- shoppingItems・レシピ・献立スケジュールは本チケットの対象外（在庫系のみ。必要になれば後続で）
- GAS/Spreadsheet/Drive 不使用、APIキー直書き禁止。RLS は既存ポリシーのまま（変更しない）

## 非ゴール

- recipe-meal-workspace.tsx / cooking-record-edit-modal.tsx の移行（TKT-0243）
- 買い物リスト・履歴ボード・レシピ保存経路の整理（TKT-0244）
- SWR/React Query や Supabase Realtime の導入

## 依存チケット

- なし（本イニシアチブの土台。TKT-0243/0244/0245 が本チケットに依存）

## 残リスク

- InventoryBoard 内の mutation 箇所が多く、置き換え漏れがあると一部操作だけ古い表示になる。grep で setInventoryItems 等の呼び出し元を全列挙して移行すること
