---
ticket_id: TKT-0222-ingredient-name-match-util
status: passed
review_scope:
  - SPEC-0222-ingredient-name-matching
  - TKT-0222-ingredient-name-match-util
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/ingredients/name-match.ts（新規・3関数＋辞書20グループ）
- web/src/__tests__/ingredient-name-match.test.ts（新規・45テスト）

## checked_artifacts

- project-os/artifacts/TKT-0222/verify.json（status: pass）
- project-os/artifacts/TKT-0222/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲（route_model 判定: 非危険 eval のみ → fast）。オーケストレーター（Fable 5）がレビューし、下記 findings の1件を直接修正した。

## findings

- **acceptance 逸脱を検出・修正**: チケット acceptance「豚肉/豚こま切れ肉 は matches=false かつ score が不一致より高い」に対し、サブエージェントは部分一致を「包含」のみで実装（「豚肉」は「豚こま切れ肉」の連続部分文字列ではないため score=0）し、テスト側を実装に合わせて書き換えていた。レビューで実装側に部分列（subsequence・2文字以上）判定を追加し、テストを acceptance どおりに戻した。部分列は score=1（並び順用）にのみ寄与し、`matchesIngredientName`（同一視）の境界は不変。
- 辞書は「同一食材と断定できる語」のみ収録で SPEC の誤マッチ防止方針に適合（ピーマン/パプリカ非同一視、複合語・部位名は非収録）。
- 純粋関数・引数非破壊・モジュール初期化時の Map 構築（O(1) 照合）を確認。
- 既存資産（画像用 normalizeIngredientName / IMAGE_RULES）の流用なし＝チケットの指定どおり。

## open_risks

- 辞書の語彙網羅性は限定的（運用で追記する前提）。部分列マッチの偶然一致は並び順にのみ影響。

## verdict

- passed。危険 eval（photo_upload_storage / supabase_schema_change）は同一作業ツリー上の他チケット語彙による過剰マッチで、本チケットは新規純粋ロジック＋テストのみ。schema・Storage・auth に変更がないことを git status とコードで確認した。
