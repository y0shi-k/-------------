# TKT-0004-recipe-collection-management.md

---
ticket_id: TKT-0004
related_specs:
  - SPEC-0004-recipe-collection-management.md
owner_role: ai-implementer
required_evals:
  - ui_component_addition
  - gas_pattern_change
status: completed
---

## 目的

モードBの基盤となる「レシピ集」機能を実装する。レシピの閲覧・追加・編集・削除と、WebやメモからのコピペをGemini APIで構造化して登録する機能を提供する。

## タスク

- [ ] `handleInit` のGASペイロードに `レシピ集` シートのヘッダー追加処理を追加
- [ ] モードB内に「レシピ集」サブタブ/セクションUIを追加
- [ ] レシピ一覧表示（カード型または行リスト型）を実装
- [ ] レシピ手動追加モーダルを実装（レシピ名、出典、材料リスト、手順リスト）
- [ ] レシピ編集モーダルを実装（既存レシピの材料JSON・手順JSONをパースして編集）
- [ ] レシピ削除機能を実装（確認後GAS経由で削除）
- [ ] テキスト貼り付け＋Gemini構造化フローを実装
  - [ ] テキストエリアUI
  - [ ] Geminiプロンプト送信（JSON形式指定）
  - [ ] レスポンスパース
  - [ ] 構造化結果を手動追加モーダルに反映
- [ ] GASペイロードを追加: `saveRecipe`, `updateRecipe`, `deleteRecipe`, `getRecipes`
- [ ] verify コマンド実行
- [ ] artifacts を `project-os/artifacts/TKT-0004/` に作成

## Acceptance

- モードBに「レシピ集」タブがあり、レシピが一覧表示される
- 「＋新規レシピ」から手動でレシピを追加でき、一覧に反映される
- 「📋テキストから追加」にレシピテキストを貼り付け、AI構造化後に保存できる
- レシピの編集・削除ができ、シートとUIに反映される
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
- 新規追加コードが既存パターンを再利用して肥大化していない
