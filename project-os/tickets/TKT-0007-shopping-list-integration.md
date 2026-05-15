# TKT-0007-shopping-list-integration.md

---
ticket_id: TKT-0007
related_specs:
  - SPEC-0007-shopping-list-integration.md
owner_role: ai-implementer
required_evals:
  - gas_pattern_change
status: completed
---

## 目的

献立にレシピを割り当てた際、またはレシピ集から直接、レシピに必要な材料と現在の食材在庫を比較して不足分を買い物リストに自動追記する。追記後、ワンタップでモードAの買い物リストタブへ遷移できる。

## タスク

- [ ] レシピの材料JSONと在庫を比較するロジックを実装
  - [ ] 同名アイテムの在庫確認
  - [ ] 数量比較（現時点では同単位のみ）
  - [ ] 不足リストの構築
- [ ] 献立割り当て成功後（TKT-0006のフロー内）に自動で比較→追記を実行
- [ ] レシピ詳細モーダルに「🛒 買い物リストに追加」ボタンを追加
- [ ] GASペイロード `addToShopping` を実装
  - [ ] 同名・同単位の未購入アイテムがあれば数量加算
  - [ ] なければ新規追加（UUID生成、ステータス=未購入）
  - [ ] `紐づくレシピ名` を設定
- [ ] GASペイロード `getShopping` を実装（更新後の再読み込み用）
- [ ] 追記完了後、showToast で「買い物リストを確認」ボタン付き通知を表示
- [ ] 「買い物リストを確認」ボタンで `switchMode('A')` + `filterByLocation('買い物リスト')` を実行
- [ ] verify コマンド実行
- [ ] artifacts を `project-os/artifacts/TKT-0007/` に作成

## Acceptance

- 献立にレシピを割り当てると、不足材料が買い物リストに自動追記される
- 買い物リストに既に同名・同単位の未購入アイテムがある場合、数量が加算される
- 追記完了後、「買い物リストを確認」ボタンが表示される
- ボタンをタップするとモードAの買い物リストタブに遷移する
- レシピ詳細から「🛒 買い物リストに追加」ボタンで手動抽出もできる
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
