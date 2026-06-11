---
ticket_id: TKT-0236-inventory-bulk-delete
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

食材カードの選択チェックボックス（TKT-0216 で配置整理済み）にチェック後のアクションが無く、不要在庫を1件ずつしか削除できなかった。買い物リストに既存の「選択削除」と同型の一括削除（確認パネル必須）を食材一覧（在庫）にも追加した。

- `web/src/components/inventory-board.tsx`:
  - `deleteSelectedInventoryItems()` を新設（465-494行）。`deleteSelectedShoppingItems` と同型で `.from("inventory_items").delete().eq("user_id", userId).in("id", selectedInventoryIds)`。成功後に `quantityNotations` 掃除・選択クリア・編集中対象なら `resetForm()`・「食材をN件削除しました。」フィードバック・`router.refresh()`。
  - 在庫一覧の `ListToolbar` に `onDeleteSelected` / `showDelete` を渡し、「選択削除」ボタンを追加。押下で `requestDelete(\`N件の食材\`, "選択した在庫を削除します。元には戻せません。", ...)` → 既存 `DeleteConfirmPanel` 経由で実行。
- `web/src/__tests__/inventory-board.test.tsx`: テスト2件追加（2件選択→確認→`inventory_items` への `.in("id",[...])` 削除と件数フィードバック、確認パネルでキャンセル時は削除されない）。

## 今回追加した安全装置

- 削除は必ず確認パネル（`DeleteConfirmPanel`）経由で、対象件数（「N件の食材」）を明示。選択0件時はボタン非活性（`ListToolbar` 既存ロジック）。
- クエリは RLS に加えて `.eq("user_id", userId)` を併用（既存削除と同じ二重防御）。
- 楽観的更新なし: Supabase 成功後にのみローカル state を更新。エラー時は「原因/影響/修正方法」形式のメッセージを表示し、行を残す。

## 実施した確認

- `/verify TKT-0236`: lint / typecheck / test / build すべて pass。policy も pass。`verify.json` 参照。
- `inventory-board.test.tsx` 単体: 28件 pass（新規2件含む）。

## 残リスク

- 一括削除に undo は無い（非ゴール）。確認パネル＋件数明示で誤操作を抑止する設計。
- 選択状態はフィルタ表示と独立のため、フィルタで非表示中の選択済みカードも削除対象に含まれる（買い物リストの既存挙動と同じセマンティクス）。

## 次の依頼や人判断

- **実機スモーク（ユーザー）**: 複数選択→「選択削除」→確認パネル→削除後にカード消滅・件数フィードバック表示、キャンセルで何も消えないこと。
- `/check-gates` の危険 eval マッチは、diff の `inventory_items` トークンの過剰マッチ（TKT-0178 等と同じ）と、並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更の同居によるもの。実 schema / RLS / Storage は無変更（manual-smokes.md / review.md に詳細）。
