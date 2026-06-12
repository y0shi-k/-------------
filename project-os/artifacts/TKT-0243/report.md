---
ticket_id: TKT-0243-meal-workspace-inventory-store-migration
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

イニシアチブ「在庫データの全画面即時反映」の T2。献立ワークスペース（recipe-meal-workspace.tsx）がローカル useState で在庫を複製していたため、調理完了で在庫を減算しても在庫一覧タブへ戻るとリロードまで反映されない不具合（イニシアチブの発端）を解消する。TKT-0242 で新設した共有在庫ストア（inventory-store.tsx）へ献立側の在庫参照・更新を移行した。

- `web/src/components/recipe-meal-workspace.tsx` … `inventoryItemsForMeals` の useState 複製を廃止し、`useInventoryStore()` の `inventoryItems` / `setInventoryItems` を alias して全参照を共有ストア化。props の `initialInventoryItems` を削除。
- `web/src/app/page.tsx` … `RecipeMealWorkspace` への `initialInventoryItems` 受け渡しを削除。
- `web/src/components/cooking-history-board.tsx` … 料理記録編集モーダルの `handleSaved` で共有ストアの `refetch(userId)` を発火し、記録編集による在庫変更も在庫一覧へ即時反映。
- テスト: `recipe-meal-workspace.test.tsx`（ストアモック化 + TKT-0243 検証3件追加）、`cooking-history-board.test.tsx`（ストアモック追加）。

### 採った方針（チケットの「report に記す」事項）

- **リフェッチ統合**: TKT-0239 の「消費ダイアログオープン時の最小リフェッチ」（`fetchFreshInventoryForMeals`）は維持し、取得した fresh をローカル変数で `buildConsumptionDrafts` へ渡す stale-read 回避はそのまま。関数内部で `setInventoryItemsForMeals(fresh)` を呼ぶことで共有ストア反映を統合した（ストアの `refetch` は値を返さない設計のため、直接 fetch + ストア更新の組合せ）。
- **更新タイミング**: 楽観的更新ではなく、Supabase 書き込み成功（await 完了）後に setState する確定後更新で統一。タブ即切替の反映はダイアログオープン時のリフェッチ + 確定後 setState で担保。
- **quantity=0 の扱い**: 共有ストアは「archived_at null かつ quantity>0」のみ保持する方針（inventory-board の表示前提）のため、消費確定・ロールバック時の更新で `quantity > 0` フィルタを適用。ロールバックで quantity=0 から復活する item はストアに存在せず map で更新できないため、欠落を検出したら非同期リフェッチでストアを最新化する。
- **cooking-record-edit-modal.tsx の差分計算**: モーダル本体は変更せず、消費側（cooking-history-board）の `handleSaved` でストア refetch を発火する最小対応に留めた。モーダルへ渡る `inventoryItems` が初回ロードのスナップショットのままである点は TKT-0244 の範囲（下記残リスク参照）。
- **danger eval の過剰マッチ**: check-gates が supabase_schema_change / auth_and_rls_policy / photo_upload_storage を検出するが、これは diff 内に inventory_items 等のテーブル名トークンが含まれることによる過剰マッチ。`supabase/` 配下・RLS policy・Storage 設定・auth は一切変更していない（チケット owner_notes で予見済み）。

## 今回追加した安全装置

- 調理完了→在庫減算→共有ストア反映の流れを Supabase クライアントモックで検証する単体テスト3件（消費確定後の setInventoryItems 呼び出し、quantity=0 item のフィルタ、ダイアログオープン時リフェッチのストア反映）。
- ロールバック時にストアから欠落した item を検出して自動リフェッチするフォールバック。
- リフェッチ失敗時は既存スナップショットへフォールバックし操作をブロックしない既存設計を維持。

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0243` … lint / typecheck / test / build 全 pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）全 pass。テスト 557件 pass（既存 544 + 新規 3 ほか）。verify.json は `project-os/artifacts/TKT-0243/verify.json`。
- オーケストレーター側で diff 全文をレビュー（`project-os/artifacts/TKT-0243/review.md`）。

## 残リスク

- cooking-record-edit-modal.tsx の差分計算（previousQuantity）は呼び出し元 props（初回ロードのスナップショット）基準のまま。handleSaved の refetch で次回編集時には最新化されるが、同一セッション内で連続編集すると古い在庫基準の差分計算になりうる。経路整理は TKT-0244 で実施。
- ロールバックによる quantity=0→復活 item の再表示は非同期リフェッチ任せのため、完了直後にタブ切替すると一瞬欠けて見える可能性（数百ms想定）。
- setState updater 内から非同期 fetch を発火しており、React StrictMode では updater が二重実行されリフェッチが重複しうる（結果は冪等で実害なし。改善余地として review.md に記録）。

## 次の依頼や人判断

- TKT-0244（買い物リスト追加・レシピ保存・履歴ボードの残り mutation 経路の整理）、TKT-0245（クロスボード同期の回帰テスト）へ続く。
- 実機での確認推奨: 献立タブで調理完了 → 在庫一覧タブへ切替 → リロードなしで数量が減っていること。完了取り消しで数量が戻ること。
