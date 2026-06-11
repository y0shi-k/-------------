---
ticket_id: TKT-0240-user-synonym-group-merge
status: passed
review_scope:
  - SPEC-0222-ingredient-name-matching
  - TKT-0240-user-synonym-group-merge
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/ingredients/name-match.ts（setUserSynonymGroups の Union-Find 化のみ）
- web/src/__tests__/ingredient-name-match.test.ts（推移的統合のテスト5件追加）

## checked_artifacts

- artifacts/TKT-0240/verify.json（status: pass）
- artifacts/TKT-0240/report.md
- artifacts/TKT-0240/manual-smokes.md

## subagent_usage

- 実装: impl-fast（Sonnet）。`harness/bin/route_model.py TKT-0240` の判定どおり
- レビュー・検証: オーケストレーター（Fable 5 メインセッション）

## findings

- Union-Find の実装は正しい（path compression あり・union by rank なしだがユーザー辞書の規模では問題なし）
- グループID は `user:${根の語}` 形式で、静的辞書の数値IDと名前空間が分かれており衝突しない。照合は各 Map 内でのみ行う既存仕様も維持
- 正規化（normalizeIngredientMatchName）後の語をキーに統合しており、豚コマ/豚こま のような表記ゆれも同一頂点として扱われる
- 2語未満の行を無視する既存仕様・イミュータブル方針（userSynonymMap は新規構築で差し替え）を維持
- user-synonyms.ts（parse / localStorage IO）は無変更で、変更不要の判断は妥当

## open_risks

- なし

## verdict

passed — verify 全 pass・純粋関数の挙動改善のみ・回帰なし
