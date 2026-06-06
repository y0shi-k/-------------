---
id: TKT-0178-meal-schedule-uncomplete-and-delete-rollback
title: 献立の完了解除・完了済み削除（在庫と料理履歴の巻き戻し・確認つき）＋全カード×ボタン
status: implementation_ready
goal: 完了にした献立を「調理していない状態」へ安全に戻せるようにし、完了時に減らした在庫と作成した料理履歴を正しく巻き戻す。誤操作による在庫ズレ・履歴汚染を防ぐ。
acceptance:
  - 7日スケジュールの完了済みカードのスロットメニューに「完了を外す」ボタンが表示される（status="完了"のときだけ）。
  - 「完了を外す」を押すと確認パネルが出て、確定すると当該献立のstatusが"未完了"・completed_atがnullに戻る。
  - 完了解除の確定で、その完了時に減算した在庫が cooking_consumption_events を根拠に元の数量へ加算復元される。
  - 完了解除の確定で、その献立に紐づく cooking_history 行と cooking_consumption_events 行が削除される。
  - 完了解除しても、その完了で保存した完成写真（Storage実体と photos 行）は削除されない（photos.cooking_history_id は FK により null 化される）。
  - 全ての献立カード（完了/未完了問わず）に×（バツ）削除ボタンが表示される。
  - 完了済みカードの×削除は確認パネルを出し、確定すると在庫を巻き戻し・cooking_history/consumption_events を削除した上で meal_schedules 行を削除する（完成写真は残す）。
  - 未完了カードの×削除は従来どおり在庫を変えずに meal_schedules 行のみ削除する。
  - 在庫が既に削除済み（stock_item_id が null）の消費行は復元対象からスキップし、エラーにならない。
  - 巻き戻しロジックの単体テストと、完了解除・完了削除の挙動テストが追加され、Web版verifyが通る。
required_evals:
  - supabase_schema_change
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/cooking-history/rollback.ts
  - web/src/components/delete-confirm-panel.tsx
  - web/src/__tests__/cooking-history-rollback.test.ts
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0178-meal-schedule-uncomplete-and-delete-rollback/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0178-meal-schedule-uncomplete-and-delete-rollback
related_artifacts:
  - artifacts/TKT-0178-meal-schedule-uncomplete-and-delete-rollback/verify.json
  - artifacts/TKT-0178-meal-schedule-uncomplete-and-delete-rollback/manual-smokes.md
  - artifacts/TKT-0178-meal-schedule-uncomplete-and-delete-rollback/review.md
  - artifacts/TKT-0178-meal-schedule-uncomplete-and-delete-rollback/report.md
owner_role: implementer
owner_notes:
  - 危険度: 「データ削除・在庫増減」に該当する危険変更として扱う。**スキーマ変更（migration）は無い**。required_evals の `supabase_schema_change` は `harness/change_evals.json` の diff_regex がテーブル名トークン（meal_schedules|cooking_history|inventory_items|photos）に過剰マッチして付くが、実際の schema/RLS/Storage は無変更。report に「実schema無変更・在庫/履歴の巻き戻しのみ」と明記する。manual-smokes/review は in-app データ削除のため**実際に必要**。
  - FK の挙動が要: cooking_consumption_events と cooking_history の対象FK（meal_schedule_id, cooking_history_id）は全て `on delete set null`（cascade ではない／`supabase/migrations/20260524193000_cooking_consumption_events.sql`, `20260523095800_fix_composite_fk_delete_actions.sql` で確認）。よって **meal_schedules を先に消すと events の meal_schedule_id が null 化し紐付けを失う**。必ず「events読込→在庫復元→events削除→cooking_history削除→（削除の場合のみ）meal_schedules削除」の順で行う。
  - 在庫復元は完了処理と対称: `web/src/components/recipe-meal-workspace.tsx` の `completeSchedule`（≈line 1298、在庫減算は line 1348-1360）が `inventory_items.quantity = max(0, quantity - consumed)` で減らす。巻き戻しは同じ stock_item_id に consumed_amount を加算して戻す。
  - 既存の差分集約ユーティリティ `web/src/lib/cooking-history/edit.ts` の `computeInventoryAdjustments`/`applyAdjustmentsToQuantities` を参考にし、events→在庫加算 adjustments を作る純関数を新規 `web/src/lib/cooking-history/rollback.ts` に切り出して単体テストする。
  - 確認UIは既存 `web/src/components/delete-confirm-panel.tsx`（`DeleteConfirmPanel`）と `requestDelete`/`pendingDelete` 機構（recipe-meal-workspace.tsx ≈line 711, 1660）を再利用。完了解除は「削除」ではないため、`DeleteConfirmPanel` に `confirmLabel?`（既定"削除する"）と `tone?`（既定"danger"）プロップを足して後方互換のまま流用する。
  - 全クエリに `.eq("user_id", userId)` を必ず付ける（既存パターン踏襲、RLSは本人限定の既存policyで充足。新規RLSは作らない）。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。APIキー・Service Role key を直書きしない。
  - 楽観的更新の戻し: 既存 completeSchedule と同様、DB成功後に `setMealSchedules` / `setInventoryItemsForMeals` を更新し、失敗時はトーストで通知して状態を変えない。
---

# Summary

7日献立スケジュール（`web/src/components/recipe-meal-workspace.tsx` の `activeView === "schedule"`）で、
完了済み献立を「未完了（調理していない状態）」へ戻す導線と、完了済みを直接削除する×ボタンを追加する。
いずれも完了時に減らした在庫を `cooking_consumption_events` を根拠に復元し、`cooking_history` と
`cooking_consumption_events` を削除して巻き戻す。完成写真だけは残す（後続 TKT-0180 の候補ソースになる）。

## 実装メモ（前提なしで着手できるよう詳述）

### 1. 巻き戻し純関数（新規 `web/src/lib/cooking-history/rollback.ts`）
- 入力: `cooking_consumption_events` 相当の配列（`{ stock_item_id: string | null, consumed_amount: number }[]`）と現在の在庫配列。
- 処理: `stock_item_id` ごとに `consumed_amount` を合算し、`stock_item_id` が null/空の行は除外。各在庫について `nextQuantity = quantity + 合算consumed` を返す。
- `web/src/lib/cooking-history/edit.ts` の `computeInventoryAdjustments`（line 75-103）/ `applyAdjustmentsToQuantities`（line 105-118）の集約パターンを踏襲。数値正規化も同ファイルの方針に合わせる。
- 例外を投げず、適用対象（id, nextQuantity）の配列を返す純関数にして単体テスト可能にする。

### 2. 共通の巻き戻し手続き（recipe-meal-workspace.tsx 内のヘルパー関数として追加）
順序厳守:
1. `supabase.from("cooking_consumption_events").select("stock_item_id, consumed_amount, cooking_history_id").eq("meal_schedule_id", schedule.id).eq("user_id", userId)` で消費行を取得。
2. rollback 純関数で在庫の next quantity を算出し、各 `inventory_items` を `.update({ quantity })` で復元（`.eq("id", ...).eq("user_id", userId)`）。
3. `supabase.from("cooking_consumption_events").delete().eq("meal_schedule_id", schedule.id).eq("user_id", userId)`。
4. `supabase.from("cooking_history").delete().eq("meal_schedule_id", schedule.id).eq("user_id", userId)`（→ photos.cooking_history_id は FK で自動 null 化。photos 行・Storage 実体は消さない）。
5. 呼び出し側に応じて: 完了解除なら meal_schedules を `{ status: "未完了", completed_at: null }` に update / 完了削除なら meal_schedules を delete。
- いずれかの step が失敗したら以降を中止し、エラートーストを出して状態を変えない（在庫復元が一部成功した場合の整合は report の残リスクに記録。可能なら復元更新はまとめて行い、部分失敗時のメッセージで再読込を促す）。

### 3. 完了解除（新規 `uncompleteSchedule(schedule)`）
- スロットメニュー（`slotMenuSchedule` の描画ブロック、recipe-meal-workspace.tsx ≈line 2006-2047）に「完了を外す」ボタンを `slotMenuSchedule.status === "完了"` のときだけ追加。
- onClick: `requestDelete` 機構で確認パネルを出す（`confirmLabel="完了を外す"`, `tone="default"` 等）。確定で上記 step1-4 + meal_schedules を未完了へ update。
- 成功トースト例: 「〇〇の完了を取り消し、在庫を戻しました。」

### 4. 完了済み削除（既存 `deleteSchedule` の拡張、recipe-meal-workspace.tsx line 1207-1226）
- `schedule.status === "完了"` のとき: step1-4 を実行してから meal_schedules を delete。
- `未完了` のとき: 現状どおり meal_schedules のみ delete（在庫操作なし）。
- 確認文言を状態で出し分け（完了済み: 「在庫を戻して献立を削除します。料理履歴も削除されます（完成写真は残ります）。」/ 未完了: 既存「この献立予定を削除します。料理履歴は削除されません。」）。

### 5. 全カード×ボタン（recipe-meal-workspace.tsx の `schedule-meal-card`、≈line 2300-2329）
- カードに×ボタンを追加し、onClick で `requestDelete(... , () => deleteSchedule(schedule))`。
- ドラッグ（draggable / onDragStart）や select（slotMenuを開くボタン）と競合しないよう、×ボタンの onClick は `event.stopPropagation()` を入れる。
- ×ボタンの最小CSSは `web/src/app/globals.css` に追加（既存 `.schedule-meal-card` 周辺）。スマホ幅でカードを潰さないこと。
- 注意: TKT-0179（複数献立表示）と同じカードDOMを触る。TKT-0179 を先行実装する場合はそのカード構造に×を載せる。本チケット単独で着手する場合は現状の単一カード構造（find）に×を載せ、TKT-0179 側で filter+map へ展開する際に踏襲する。

### 6. 確認UIの汎用化（`web/src/components/delete-confirm-panel.tsx`）
- `confirmLabel?: string`（既定 "削除する"）と `tone?: "danger" | "default"`（既定 "danger"）を props に追加。既存呼び出し（inventory-board.tsx, recipe-meal-workspace.tsx）は引数追加なしで現状維持。

## 検証メモ

- `/verify TKT-0178-meal-schedule-uncomplete-and-delete-rollback`（lint/typecheck/test/build + policyチェック）。
- 単体テスト: rollback 純関数（合算・null除外・複数stock集約・0件）。
- コンポーネントテスト: 完了→完了を外す→status/在庫/履歴の巻き戻し、完了削除→在庫復元+行削除、未完了削除→在庫不変。
- manual-smokes（必須）: 実機で「完了で在庫が減る→完了を外す→在庫が元値に戻る・cooking_history/consumption_events が消える・photos 行は残る（cooking_history_id=null）」「完了済み×削除で在庫が戻る」「未完了×削除で在庫不変」。
- review（必須）: 削除/復元クエリに user_id 条件が付き本人限定か、FK順序（events→history→schedule）が守られているか、部分失敗時の扱い。

## 非ゴール

- 1スロットに複数献立を表示すること（→ TKT-0179）。
- 残した完成写真を別用途の候補として選べるようにすること（→ TKT-0180）。
- スキーマ変更（テーブル/カラム/RLS/Storage policy）。本チケットは既存テーブル・FKのみで成立。
- 料理履歴画面（カレンダー/タイムライン）側の表示改修。

## 依存チケット

- 先行依存なし（単独着手可能）。ただし TKT-0179 と同じカードDOMを編集するため、実装順は TKT-0178 → TKT-0179 を推奨（×ボタンの土台を先に作る）。
- 本チケットの「完成写真を残す」結果が TKT-0180 の候補ソース（cooking_history_id が null の photos 行）を生む。

## 残リスク

- 在庫復元の途中失敗時、一部だけ復元される可能性。まとめ更新と再読込誘導で軽減し、report に明記する。
- 完了→在庫編集（別画面で手動増減）→完了解除、の順だと「元の数量」が手動変更後の値に加算される。これは仕様（events の consumed_amount を足し戻すだけ）であることを report/glossary に記録。
