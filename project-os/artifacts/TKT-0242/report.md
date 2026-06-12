---
ticket_id: TKT-0242-shared-inventory-store-foundation
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

3ボード（在庫/献立/履歴）が web-mode-shell.tsx で常時マウント（hidden切替）されているのに、各ボードが server props を `useState(initialXxx)` に複製しているため、在庫 mutation が兄弟ボードへ伝播せずリロードが必要になる構造問題の土台を解消する（SPEC-0242 のイニシアチブ T1）。

- 共有在庫ストア `web/src/components/inventory-store.tsx` を新設（`InventoryStoreProvider` + `useInventoryStore()`）。state は inventoryItems（現役）/ archivedInventoryItems / storageLocations、公開 API は state + 楽観的 setter（`Dispatch<SetStateAction>` 互換）+ `refetch(userId)`。
- `web/src/app/page.tsx` で `WebModeShell` を Provider で包み、初期値は initial props（追加フェッチなし）。
- `web/src/components/inventory-board.tsx` の在庫系 `useState(initialXxx)` 3つを撤廃しストア参照へ移行。setter は同一シグネチャのため既存 mutation 箇所（L361, 489, 926-929, 953-955, 1102, 1134-1141, 1175-1176, 1205）は構造変更なしで共有ストア経由になった。
- shoppingItems / userIngredientImages はチケットどおり対象外（ローカル state のまま）。

## 今回追加した安全装置

- `web/src/__tests__/inventory-store.test.tsx` を新規作成: Provider 初期値の伝播と setter 更新の参照側反映を検証（2ケース）。
- `useInventoryStore()` は Provider 外で使うと即 throw（取り違え防止）。
- `refetch` の select・並び順・limit は page.tsx の初回フェッチ（L39-52, L87-92）と完全一致させ、整形不整合を防止。

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0242` → status: pass（lint / typecheck / test 556件 / build すべて pass、policy 4項目 pass）。verify.json は本ディレクトリに保存済み。
- 既存 inventory-board テスト28件は Provider wrap 追加のみで全 pass（挙動回帰なし）。

## 残リスク

- **check-gates の危険 eval（supabase_schema_change / auth_and_rls_policy / photo_upload_storage）は `inventory_items` 等のトークンによる過剰マッチ。実際は Supabase schema / RLS / Storage / auth / AI route を一切変更していない（クライアント側 state 再構成のみ）。** 過去運用（TKT-0239 ほか）と同じ扱い。
- `refetch` はクエリ失敗時 silent fail（既存 mutation パターンと一貫）。UI フィードバックは呼び出し元の責務。
- 献立側（recipe-meal-workspace.tsx / cooking-record-edit-modal.tsx）は未移行のため、発端の不具合（調理完了→在庫一覧が古い）は TKT-0243 完了まで解消しない。

## 次の依頼や人判断

- TKT-0243（献立ワークスペースのストア移行）に着手する。本ストアの setter / refetch をそのまま利用できる。
- 実機での在庫追加・編集・消費・アーカイブの目視スモークは任意（jsdom テストでは回帰なしを確認済み）。
