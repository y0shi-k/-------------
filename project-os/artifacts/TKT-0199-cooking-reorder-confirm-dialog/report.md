---
ticket_id: TKT-0199-cooking-reorder-confirm-dialog
status: ready
verified_at: 2026-06-07T11:14:02+09:00
---

# 実装レポート

## 変更目的

全画面ビュー（CookingViewer）の「並び替えを確定」は、押すと確認なしでレシピ本体（`recipes.prep_steps`/`steps`・`recipe_ingredients.sort_order`/`item_type`）へ即上書き保存していた。誤操作による上書きを防ぐため、保存前に確認を挟むようにした。

## 変更内容

- `requestSaveCookingReorder(recipe)` を新設。`hasCookingReorderChanges` が無ければ何もせず、ある場合のみ確認を出す。
- 確認UIは新規ダイアログを増やさず、TKT-0197 の調理完了前確認と同じ `requestDelete` / `DeleteConfirmPanel` を流用（state・描画箇所とも共通）。
- 確定ボタンの `onClick` を `saveCookingReorder` の直接呼び出しから `requestSaveCookingReorder` へ変更。
- 確認OK（「並びを確定」）時のみ既存 `saveCookingReorder` を実行。やめる時は state を一切変えず未確定の並び替えを保持する。

## 今回追加した安全装置

- 並び替えロジック・保存対象カラム（`prep_steps`/`steps`/`sort_order`/`item_type`）は変更していない。確定後のUndo/Redo履歴クリア等の既存挙動も維持。
- 確認文言は「レシピ本体の材料・手順の並びを、この順番で上書きします。よろしいですか？」とし、何が起きるか明示した。
- DB schema、Storage、AI/API、認証/RLSは変更していない。
- Canvas版 `app.html` は編集していない。APIキー等の直書きはない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0199-cooking-reorder-confirm-dialog`: pass
  - lint: pass / typecheck: pass / test: pass / build: pass
  - policy: pass（GAS混入なし、秘密直書きなし、RLS確認、backlog focus lean）
- 追加テスト「confirms before committing a cooking reorder and cancels without saving」: 確定ボタン押下で確認（`alertdialog` 「並び替え確認」）が出ること、「やめる」で保存されず未確定が残ること、再度確定→OKで既存の保存フローが走り `sort_order` が保存されることを確認。
- 既存の並び替え保存テスト3件（手順・材料・グループ間移動）を、確認OK（「並びを確定」）を挟む形に更新し全てpass。
- 全37テストがpass。

verify結果は `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/verify.json` に保存済み。

## schema/Storage 系evalについて（静的説明）

`required_evals` は `pwa_mobile_ui`。`/check-gates` が `recipes` 等の文言で schema/Storage 系evalを過剰検出する場合があるが、本変更は:

- migration追加なし（`supabase/` 配下に変更なし）。
- 保存対象カラムの変更なし（既存 `saveCookingReorder` をそのまま流用）。
- 新規DB書き込み経路の追加なし（確認を挟むだけ）。

したがって schema/Storage/auth 系の追加成果物は不要。

## 追加修正（実機フィードバック反映）

- 初回実装では「並び替えを確定」を押しても無反応に見える不具合があった。原因は `.delete-confirm-backdrop` の `z-index: 80` が全画面ビュー `.cooking-overlay`（z-index: 85）より低く、確認ダイアログが全画面ビューの裏に隠れていたこと。
- `.delete-confirm-backdrop` の `z-index` を 100 に引き上げ、全画面ビュー(85)・消費量/不足選択モーダル(90)の上に常に出るよう修正（`globals.css`、CSSのみ）。
- 同機構を使う TKT-0197 の「未確定のまま料理完了」確認も同様に裏に隠れていたため、本修正で併せて解消。

## 残リスク

- 確認文言・ボタン名は既存の `DeleteConfirmPanel`（tone="default"）を流用。専用デザインが必要なら別チケットで調整する。

## 次の依頼や人判断

- 実機で確認ダイアログの文言・操作感を確認すると安心。
