---
ticket_id: TKT-0244-remaining-mutation-sync-cleanup
status: ready
---

# Report

## 変更目的

イニシアチブ「在庫データの全画面即時反映」の T3。TKT-0242/0243 で在庫の主要経路は共有ストア
（`web/src/components/inventory-store.tsx`）化済みだったが、買い物リスト追加（`confirmRecipeShortageSelection()`）、
レシピ保存（`saveRecipe()`）、料理履歴編集など、`router.refresh()` 頼みで他ボードに反映されない
mutation 経路が残っていた。これらの「リロードしないと出ない」取りこぼしを一掃した。

## 採った方針

**買い物リストを共有ストアへ含める**（明示 refetch ではなくストア拡張）。

- `inventory-store.tsx` に `shoppingItems` / `setShoppingItems` / `refetchShoppingItems(userId)` を追加。
  Provider の初期値は `page.tsx` から `initialShoppingItems` として注入。
- 理由: 買い物リストは inventory-board と recipe-meal-workspace の両ボードが書き込む共有データであり、
  在庫と同じ「ローカル state の二重管理」問題を抱えていたため。inventory-board.tsx のローカル
  `shoppingItems` state は撤廃し、ストア参照に統一した（チケット残リスク欄の二重管理を解消）。
- レシピ本体（`saveRecipe()`）は recipe-meal-workspace 内で完結するデータ（他ボード非参照）のため、
  ローカル `setRecipes` 更新のみとし、不要な `router.refresh()` を削除した。

## router.refresh() 全列挙と対応一覧（acceptance 3）

| ファイル:行（対応前） | 経路 | 対応 |
|---|---|---|
| inventory-board.tsx:405,435,456,486 | 買い物リスト追加/購入済/削除等 | **削除** — `setShoppingItems` でストア同期 |
| recipe-meal-workspace.tsx:1892 | deleteSchedule | **削除** — 連動削除した買い物項目を `setShoppingItems` で除去 |
| recipe-meal-workspace.tsx:2011,2646 | 献立ロールバック/完了 | **削除** — 共有ストアの `refetch()` で同期 |
| recipe-meal-workspace.tsx:2087付近 | confirmRecipeShortageSelection | **削除** — 追加結果を `setShoppingItems` でストアへ即時反映 |
| cooking-history-board.tsx:220 | 履歴編集保存 | **削除** — `refetchInventory(userId)`（TKT-0243 実装済）で十分 |
| login-form.tsx:42 / reset-password-form.tsx:69 / logout-button.tsx:27 | 認証系 | **対応不要** — セッション切替で全画面更新が正当 |
| inventory-board.tsx:359 | 保存場所追加 | **対応不要** — 同一ボード内で完結（保存場所はストア経由で既に共有済み） |
| recipe-meal-workspace.tsx:1738 | 献立移動 | **対応不要** — 献立スケジュールは同ボード内のみ参照 |
| recipe-meal-workspace.tsx:2343 | レシピ手順並び替え | **対応不要** — レシピ内部構成、他ボード非参照 |

## 今回追加した安全装置

- 買い物リストを共有ストアに一本化し、ローカル state との二重管理（更新の取りこぼし源）を構造的に排除。
- 献立削除時に連動削除される買い物項目をストアからも除去する処理を追加（DB と画面の不整合防止）。
- 共有ストア経由の買い物リスト挙動をユニットテストに追加し、回帰を検知できるようにした。

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0244`: lint / typecheck / test / build すべて pass、
  policy（GAS漏れ・秘密直書き・RLS）も pass（`verify.json` 参照）。
- テスト更新: `inventory-board.test.tsx` / `inventory-store.test.tsx` / `recipe-meal-workspace.test.tsx` /
  `cooking-history-board.test.tsx` を共有ストア経由の買い物リストに合わせて更新・追加。

## danger eval 過剰マッチについて（owner_notes 対応）

check-gates が supabase_schema_change / auth_and_rls_policy / photo_upload_storage を検出したが、
これは diff 中のテーブル名トークン（`shopping_items`、`recipe_ingredients` 等）や既存コード近傍の
文字列によるパターンマッチである。**本チケットに Supabase schema / migration / RLS policy /
Storage 設定 / 認証フローの変更は一切ない**（変更は `web/src/components/` と `web/src/app/page.tsx`、
テストのみ）。ticket owner_notes で事前に予見されたケースであり、review.md / manual-smokes.md は
この前提の static 確認として残す。

## 残リスク

- 別端末・別セッション間の同期は対象外（Supabase Realtime 未導入。イニシアチブの非ゴール）。
- 回帰テストの体系的整備は TKT-0245 で実施予定。

## 次の依頼や人判断

- TKT-0245（クロスボード同期の回帰テスト整備）への着手判断。
