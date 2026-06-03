---
ticket_id: TKT-0156-recipe-seasoning-classification-fix
status: passed
execution_mode: automated_and_static
target_evals:
  - supabase_schema_change
---

# TKT-0156 manual smokes

実行日時: 2026-06-03 08:00 JST

## 注記

- `supabase_schema_change`（危険eval）は `/check-gates` の diff 自動判定が、`cooking-record-edit-modal.tsx` 等の文脈行に含まれるテーブル名様の語（`recipe_ingredients` / `cooking_history` / 写真処理コード等）と正規表現 `inventory_items|...|cooking_history|photos` に過剰マッチしたもの。
- 実変更は履歴編集の分類ロジック（在庫category→レシピ材料 item_type）、AI生成プロンプト文言、テストのみ。Supabase schema / migration / RLS / Storage は変更していない。

## target_evals

- `supabase_schema_change`（過剰マッチ）: 実変更なし。`supabase/` 配下のファイルは未編集、`cooking_consumption_events` に列追加なし、RLS/DB型/migration 未変更。

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| verify一式 | pass | `harness/bin/verify_web.sh TKT-0156-recipe-seasoning-classification-fix` で lint/typecheck/test/build/policy すべて pass |
| 対象テスト | pass | `cooking-history-edit.test.ts` 10件 pass（調味料分類・"食材"フォールバック・復元経路の item_type 引き継ぎを含む） |
| schema 変更の有無 | pass | `git status` で `supabase/` の変更なし。`git diff -- web/` に `create table` / `alter table` / `create policy` / `enable row level security` の追加なし |
| 分類ロジック統一 | pass | 履歴編集が `draft.item_type`（レシピ材料由来）で分類するようコードで確認。完了画面（`ingredient.item_type`）と一致 |
| 調味料フォールバック | pass | レシピ材料未一致／recipe_id なし時に "食材" になることをテストで確認 |
| AI生成プロンプト | pass | generate/structure 両モードに調味料分類指示を挿入、スキーマ例に調味料行を追加。鍵・通信ロジックは不変 |
| policy チェック | pass | GAS依存なし、秘密直書きなし、RLS存在確認 pass |
| ビルド成功 | pass | `npm run build` 通過 |

実行コマンド:

```bash
git status --porcelain
git diff -- web/ | grep -nE "create table|alter table|create policy|enable row level security"
harness/bin/verify_web.sh TKT-0156-recipe-seasoning-classification-fix
```

## skipped_checks

- 実機UIでの「調味料入りレシピを調理完了→履歴編集→調味料タブ表示」の目視は未実施（この環境で実機操作がないため）。コードとテストでは退行なし。
- AI生成の実呼び出し（Gemini）での調味料分類結果は未検証（鍵・通信を伴うため）。プロンプト文言の追記のみで、パーサは既存の `調味料` 解釈を利用。

## open_risks

- 既存のAI生成済みレシピは `item_type` が "食材" のまま残る（データ移行は含まない）。
- AIモデルが指示に従わず調味料を "食材" で返す可能性は残る。
