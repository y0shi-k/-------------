---
id: TKT-0236-inventory-bulk-delete
title: 食材一覧の選択チェックから確認パネル付き一括削除を実行できるようにする
status: completed
goal: 食材カードの選択チェックボックスにチェック後のアクションが無く、不要在庫を1件ずつしか消せない手間（とチェックUIが意味を持たない状態）を防ぐ。
acceptance:
  - 食材一覧（在庫）で1件以上選択中に「選択削除」ボタンが操作でき、押すと `DeleteConfirmPanel` による確認（対象「N件の食材」・「選択した在庫を削除します。元には戻せません。」相当の文言）が表示される
  - 確認パネルで「削除する」を押すと、選択中の全 `inventory_items` 行が `.delete().eq("user_id", userId).in("id", selectedInventoryIds)` 形で一括削除される
  - キャンセルすると何も削除されず、選択状態は維持される
  - 削除成功後、画面から該当カードが消え、`selectedInventoryIds` が空になり、「食材をN件削除しました。」形式のフィードバックが表示される
  - 削除した食材の `quantityNotations`（分数表記 state）も掃除される（単体削除 `deleteItem` と同等の後処理）
  - 削除中の編集対象（`editing`）が削除対象に含まれていた場合、編集フォームがリセットされる
  - 削除失敗時（Supabase error）は原因・影響・修正方法を含むエラーフィードバックが表示され、ローカル state から行が消えない
  - 選択0件のときは一括削除が実行されない（ボタン非活性または非表示。買い物リストの既存挙動に合わせる）
  - 既存の単体削除・買い物リストの一括削除・選択トグル/全選択/解除の挙動は変わらない
  - コンポーネントテスト（複数選択→選択削除→確認→`.in("id", [...])` 呼び出しと件数フィードバック、キャンセル時の非削除）が追加され通る
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0236/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0105-inventory-and-staging-web
related_artifacts:
  - artifacts/TKT-0236/verify.json
  - artifacts/TKT-0236/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0236`。コマンドの正本は `harness/registry.json`
  - 非危険変更（ユーザー起点のUI削除。既存の単体削除・買い物一括削除と同じ経路）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - `/check-gates` が diff の `inventory_items` トークンで supabase_schema_change（danger）を過剰マッチさせる可能性があるが、実 schema は無変更。report に明記する既存運用（TKT-0178 等と同じ）に従う
  - 削除は RLS 前提に加えクエリでも `.eq("user_id", userId)` を必ず併用する（既存削除と同じ防御）
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

食材カードの選択チェックボックス（TKT-0216 で配置整理済み・`selectedInventoryIds` state 存在）にアクションが無い。買い物リストに既にある「選択削除」（確認パネル付き一括削除）と同型の機能を、食材一覧（在庫）にも追加する。

## 参照すべき既存実装（ほぼ完全な同型パターンが既存）

- `web/src/components/inventory-board.tsx`
  - **一括削除の手本**: `deleteSelectedShoppingItems()`（443-463行）。`.from("shopping_items").delete().eq("user_id", userId).in("id", selectedShoppingIds)` → 成功時に items filter・選択クリア・件数フィードバック・`router.refresh()`。これを `inventory_items` 向けに新設する。
  - **単体削除の後処理**: `deleteItem()`（1153-1177行）。`clearQuantityNotation` / `quantityNotations` の掃除・`setSelectedInventoryIds` filter・`editing` 中なら `resetForm()`・フィードバック。複数件版で同じ後処理を行う。
  - **確認パネル発火**: `requestDelete(target, message, confirm)`（329-332行）と `pendingDelete` → `DeleteConfirmPanel` 描画（1207-1219行）。買い物側の呼び出し例は 1565行（`requestDelete(\`${selectedShoppingIds.length}件の買い物\`, "選択した買い物を削除します。元には戻せません。", deleteSelectedShoppingItems)`）。
  - **ボタン配置の手本**: 買い物リストの「選択削除」ボタン（1561-1569行）。在庫一覧側の同等位置（ListToolbar 周辺）に合わせて置く。`ListToolbar`（1848-1873行）には `onDeleteSelected` / `showDelete` props が既にあるので、こちらを使う形でもよい（買い物側と見た目の一貫性を優先）。
  - 選択 state: `selectedInventoryIds`（276行）・`toggleSelected`（561-564行）は既存。変更不要のはず。
- `web/src/components/delete-confirm-panel.tsx` … props（message / onCancel / onConfirm / target / disabled）。変更不要。
- `web/src/__tests__/inventory-board.test.tsx`
  - **テストの手本**: 「bulk deletes selected shopping items」（1076-1099行）と `deleteInQuery()` モックヘルパー（113-118行）。在庫版はこれを流用し、`from).toHaveBeenCalledWith("inventory_items")` と `inIds` の検証に差し替える。

## 実装メモ

- `deleteSelectedInventoryItems()` を `deleteSelectedShoppingItems` と同じ形で新設。state 更新はすべてイミュータブル（filter / スプレッド。既存コードのパターン踏襲）。
- 楽観的更新はしない（既存と同じく、Supabase 成功後にローカル state を更新する）。
- エラーメッセージは買い物版の「原因/影響/修正方法」形式に合わせる。
- アーカイブ（数量0で archive される既存挙動）とは別経路。アーカイブ行の扱いは現状の選択対象仕様のままとし、特別扱いを増やさない。

## 非ゴール

- 一括アーカイブ・一括編集・一括カテゴリ変更など削除以外の一括操作。
- 買い物リスト・staging 側の挙動変更。
- 削除の取り消し（undo）機能。
- DB schema / RLS の変更。

## 依存チケット

- なし（TKT-0234/0229 と独立。並行実装可）

## 残リスク

- 一括削除は単体削除より誤操作の影響が大きいが、確認パネル必須＋件数明示で抑止する（undo は非ゴール）。
