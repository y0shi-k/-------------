---
id: TKT-0239-consumption-dialog-inventory-refetch
title: 料理完了の消費ダイアログを開く時点で在庫を再取得し、食材管理での変更を反映する
status: completed
goal: 献立ボードの在庫スナップショット（inventoryItemsForMeals）がページ初回ロードのまま古くなり、食材管理で追加・補充した在庫（例: 豚コマ）が消費ダイアログの自動マッチングに反映されない不具合を防ぐ
acceptance:
  - 「料理を完了する」で消費ダイアログを開く時点（buildConsumptionDrafts の前）に Supabase から inventory_items を再取得し、inventoryItemsForMeals を最新化してからドラフトを構築する
  - 再取得失敗時は既存スナップショットで従来どおり動作し、エラーで操作をブロックしない（console.error ではなく既存の feedback/tone 方針に合わせるか、静かなフォールバックとする）
  - 再取得の対象・整形は page.tsx の初回フェッチ（select・並び順・signed URL の扱い）と不整合を起こさない。署名URLの再発行が不要なら既存値を維持する
  - 既存の消費確定・ロールバック処理（setInventoryItemsForMeals 更新箇所 1793/1900/2482 行付近）と競合しない
  - 料理記録編集モーダル（cooking-record-edit-modal / lib/cooking-history/edit.ts の findMatchingStock 利用側）にも同じ鮮度問題があるか確認し、同一修正で安全に賄えるなら適用、リスクがあれば report に見送り理由を記す
  - 単体テスト: ダイアログオープン時に最新在庫でドラフトが組まれること（再取得をモックして検証）を追加する
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0125-cooking-completion-consumption-web
related_artifacts:
  - artifacts/TKT-0239-consumption-dialog-inventory-refetch/verify.json
  - artifacts/TKT-0239-consumption-dialog-inventory-refetch/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0239`（= `harness/bin/verify_web.sh`）
  - diff に `inventory_items` トークンが入るため `supabase_schema_change` が match_rules 上は過剰マッチしうるが、実際は読み取り（select）のみで schema/policy 無変更。過去運用（TKT-0178 ほか）どおり report に「実schema無変更」を明記する
  - データ削除・移行なし＝非危険変更扱い。必須成果物は verify.json + report.md
---

# Summary

豚こま肉（レシピ材料）が在庫の豚コマに自動マッチしない報告の根本対応。名前マッチング（name-match.ts）は静的辞書で豚コマ↔豚こま肉を既にカバーしており正常（vitest で確認済み）。失敗していたのは在庫データの鮮度。

## 原因(調査済み・2026-06-11)

- `inventoryItemsForMeals` は `useState(initialInventoryItems)`（recipe-meal-workspace.tsx:469）で、page.tsx:147 のサーバーフェッチ（初回ロード時）から一度も再取得されない。
- 食材管理ボード（inventory-board）は別コンポーネント・別stateで、在庫の追加・補充・改名が献立ボードへ一切伝わらない。
- 266c477 で3モードボードが常時マウント（hidden切替）になったため、ページ再読込まで古いスナップショットがセッション中ずっと残る。
- 消費ダイアログは completeSchedule（2272-2285行）で `buildConsumptionDrafts`（1213行）を呼び、`findMatchingStock` は ①分類一致 ②単位一致 ③quantity>0 ④名前一致 の AND。古い在庫リストに豚コマが無い/数量0のままだと自動選択されない。

## 設計方針（メインセッション承認済み）

- 共有state化（context持ち上げ）は影響範囲が大きいため見送り。**ダイアログを開く瞬間の最小リフェッチ**を採用する。
- completeSchedule のダイアログ初回オープン分岐（pendingConsumptionScheduleId !== schedule.id）内で `await` 再取得 → `setInventoryItemsForMeals(fresh)` → fresh を使って `buildConsumptionDrafts` を組む。state 反映待ちに依存せず、取得結果のローカル変数からドラフトを構築すること（setState 直後の stale read に注意）。
- 二重タップ・取得中の再入を防ぐ（既存 isSaving 等の仕組みに合わせる）。

## 実装メモ

- 編集対象は `web/` のみ。Canvas版 `app.html` は凍結・参照専用
- GAS/Spreadsheet/Drive 不使用。APIキー直書きなし。RLS は既存 select ポリシーの範囲内（user_id スコープ）を踏襲
- page.tsx の初回フェッチの select 列・order を正として揃える（差分があると表示順や undefined 列で回帰する）

## 残リスク

- ユーザー側の事象が「単位/分類不一致」（仕様どおり「その他の在庫」に出るケース）だった場合、本修正では解消しない。report に切り分け手順（再読込で直るか）を記載しユーザー実機スモークで確定する
