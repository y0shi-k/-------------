# TKT-0001-compact-inventory-list.md

---
ticket_id: TKT-0001
related_specs:
  - SPEC-0001-compact-inventory-list.md
owner_role: ai-implementer
required_evals:
  - ui_component_addition
  - gas_pattern_change
status: completed
---

## 目的
在庫一覧がカード型で1画面に入らず、期限情報も見えない状態を解消する。行リスト型にしてソート・編集・数量調整を可能にする。

## タスク
- [x] `renderList()` の在庫表示を行リスト型に変更
- [x] ソートUI（期限順/名前順/購入日順）を追加
- [x] 期限ハイライト（赤/黄/通常）を追加
- [x] 数量±ボタンを各行に追加し、GAS即時反映
- [x] 在庫アイテム編集モーダルを実装（既存モーダル流用）
- [x] 在庫アイテム削除機能を実装
- [x] verify コマンド実行
- [x] artifacts を `project-os/artifacts/TKT-0001/` に作成

## Acceptance
- 在庫タブ（すべて/冷蔵庫/冷凍庫/パントリー）で行リストが表示される
- デフォルトソートが「期限が近い順」である
- 期限切れは赤、3日以内は黄でハイライトされる
- ±ボタンで数量変更ができ、DBに反映される
- 編集ボタンからモーダルが開き、内容を更新できる
- 削除ボタンから確認後、DBから削除できる
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
