---
ticket_id: TKT-0239-consumption-dialog-inventory-refetch
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

レシピ材料「豚こま肉」が在庫「豚コマ」に自動マッチしないというユーザー報告（2026-06-11）の根本対応。

調査の結果、名前マッチング（`name-match.ts`）は静的辞書が豚コマ↔豚こま肉を既にカバーしており正常（vitest で確認済み）。失敗していたのは**在庫データの鮮度**: 献立ボードの `inventoryItemsForMeals` はページ初回ロード時のサーバーフェッチ（page.tsx）で固定され、食材管理ボードでの在庫追加・補充が伝わらない。266c477 で3モードボードが常時マウント（hidden切替）になったため、ページ再読込まで古いスナップショットが残り続け、「料理を完了する」の消費ダイアログの自動マッチング（`findMatchingStock` = 分類一致 AND 単位一致 AND quantity>0 AND 名前一致）が古い在庫で実行されていた。

## 変更内容

- `web/src/components/recipe-meal-workspace.tsx`
  - `fetchFreshInventoryForMeals()` 新設: `inventory_items` を select（列・絞り込み・並び順は page.tsx の初回フェッチと完全一致: `"*"` / user_id / archived_at null / quantity>0 / created_at desc）。エラー・例外時は null を返す
  - `buildConsumptionDrafts(schedule, inventoryItems = inventoryItemsForMeals)`: 在庫リストを明示引数化し、setState 反映待ちに依存せず取得直後のローカル変数からドラフトを構築（stale read 回避）
  - `completeSchedule` のダイアログ初回オープン分岐で `await` 再取得 → 成功時は `setInventoryItemsForMeals(fresh)` で state も更新 → `buildConsumptionDrafts(schedule, fresh ?? 既存スナップショット)`
  - `isOpeningConsumption` state 新設: 取得中の再入防止＋完了ボタンの disabled に追加（二重タップ対策）
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 新規2件: ①リフェッチで補充済み在庫（玉ねぎ0→5個）が自動マッチし確定で consumed_amount/stock_item_id が記録される ②リフェッチ失敗時に既存スナップショットへフォールバックしダイアログは開く。既存の消費完了テストは select チェーンのモック追加で維持

## 今回追加した安全装置

- リフェッチ失敗時のフォールバック: エラー（supabase の error 戻り値）も例外（ネットワーク throw）も握って null → 既存スナップショットで従来どおり動作し、操作をブロックしない（オーケストレーターレビューで try/catch を追補。throw 時に `isOpeningConsumption` が解除されず完了ボタンが永久ロックする穴を塞いだ）
- 取得中の再入ガード（isOpeningConsumption + ボタン disabled）
- テスト 65件（既存63 + 新規2）全パス

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0239` → lint / typecheck / test / build / policy すべて pass（try/catch 追補後に再実行済み）
- `cooking-record-edit-modal.test.tsx` / `cooking-history-edit.test.ts` 23件 無影響確認
- **supabase_schema_change eval について**: diff に `inventory_items` トークンが含まれるため match_rules 上はマッチするが、実際は**読み取り select の追加のみで schema / policy / migration は一切変更していない**（既存 RLS の user_id スコープ内）。過去運用（TKT-0178 等）どおり本 report に明記する

## 残リスク

- ユーザー報告の事象が「単位/分類不一致」（仕様どおり「その他の在庫」に出るケース）だった場合、本修正では解消しない。切り分け: 修正版でもマッチしなければ在庫側の豚コマの単位（g か）・分類（食材か）を確認する
- 料理記録編集モーダル（cooking-record-edit-modal）にも同じ鮮度問題が存在するが、**意図的に見送り**: 同モーダルは在庫リストをドラフト構築だけでなく保存時の在庫差分計算（previousQuantity）にも使うため、部分的に fresh を混ぜると在庫数量を誤更新するリスクがある。安全に直すには在庫を local state 化して全参照を差し替える別スコープの改修が必要（必要になったら別チケット）

## 次の依頼や人判断

- ユーザー実機スモーク: 食材管理で在庫を追加/補充（例: 豚コマ 500g・食材）→ ページを再読込**せず**に 献立 → 「料理を完了する」→ 消費ダイアログで該当材料に在庫が自動選択されていること
- 上記で解消しない場合は在庫側の単位・分類を確認（残リスク参照）
- cooking-record-edit-modal の鮮度問題を直すかの判断（別チケット起票）
