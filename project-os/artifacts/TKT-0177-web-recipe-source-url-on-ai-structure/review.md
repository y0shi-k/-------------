---
ticket_id: TKT-0177-web-recipe-source-url-on-ai-structure
status: passed
review_scope:
  - SPEC-0177-web-recipe-source-url-on-ai-structure
  - TKT-0177-web-recipe-source-url-on-ai-structure
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

本チケットの変更は以下のみ（`web/` のソースとテストに限定。`supabase/` には未変更）:
- `web/src/lib/ai/recipe-generation.ts` — source 抽出フォールバック・プロンプト指示・サニタイズ
- `web/src/app/api/ai/recipes/route.ts` — `parseGeminiRecipeResponse` に `{ mode, sourceText }` を渡す1行のみ
- `web/src/components/recipe-meal-workspace.tsx` — `RecipeSourceLinks` 追加と表示差し替え
- `web/src/app/globals.css` — 表示スタイル追加
- `web/src/__tests__/recipe-generation.test.ts`（新規）/ `web/src/__tests__/recipe-meal-workspace.test.tsx`（追記）

## checked_artifacts

- `verify.json`: status=pass（lint/typecheck/test/build＋policy 全 pass）。
- `report.md`: 変更目的・安全装置・確認・残リスクを記載。

## subagent_usage

- 調査フェーズで Explore サブエージェントを使用（Web版の構造化フローと Canvas版の source 抽出/表示の比較）。実装・レビューは本セッションで実施。

## findings

- `supabase_schema_change` および `photo_upload_storage`（いずれも🔴危険）eval が `/check-gates` でマッチするが、**実際の schema/Storage/auth/RLS 変更は無い**。要因は (1) `supabase_schema_change` の `diff_regex_any` に含まれる `recipes` 等テーブル名トークンが、`recipes` テーブルを参照する通常の web コードに当たる過剰マッチ、(2) 作業ツリーに残る別チケット TKT-0173 の未コミット migration を whole-tree diff が拾うこと、(3) `photo_upload_storage` の `image`/`画像` トークンが既存の画像表示コード（`RecipeThumb imageUrl` 等）や artifact 文言に当たる過剰マッチ。本チケットは画像取り込み・圧縮・Storage 保存を変更しない。
- diff を目視確認した結果、`supabase/` への変更・`create/alter table`・`create policy`・Storage 操作・auth フローの変更は本チケットに含まれない。Gemini送信・APIキー扱い・AI利用枠の予約/返金・mime設定も不変更（post-parse の source 正規化と表示のみ）。
- 秘密情報の直書き・`console.log`・`dangerouslySetInnerHTML` の使用なし（表示は React エスケープ）。

## open_risks

- URL末尾トリム（`trimUrlTrailingPunctuation`）は対の括弧を保持する実装だが、特殊記号を含むURLで想定外トリムが理論上あり得る（主要ケースはテストで固定）。
- 既存レシピの `source == "AI提案"` データは未移行（新規構造化以降に適用）。

## verdict

passed。本チケットは `web/` のみの非危険変更で、危険 eval は過剰マッチ。verify pass・テスト追加済み。実機での貼付→構造化→保存→リンク表示の目視確認はユーザー残課題。
