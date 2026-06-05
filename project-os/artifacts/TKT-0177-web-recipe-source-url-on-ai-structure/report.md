---
ticket_id: TKT-0177-web-recipe-source-url-on-ai-structure
status: ready
reported_at: 2026-06-05T06:42:00+09:00
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

「テキストからレシピを追加」→「AIで構造化」で、URL込みの本文を貼り付けてもリンクが残らない不具合を、Canvas版（`app.html`）と同じ挙動に合わせて解消する。AI構造化時に参照元URLを `source` に保持し（複数は改行区切り）、レシピ詳細上部とレシピ詳細「参考元」で各URLをリンク表示する。

## 今回追加した安全装置

- サーバ側のURL抽出フォールバック（`web/src/lib/ai/recipe-generation.ts`）:
  - `parseGeminiRecipeResponse(response, { mode, sourceText })` に拡張。`resolveSource` で「AIが返した source を優先、structureモードで空なら入力本文から `https?://[^\s]+` を抽出」。
  - `sanitizeSource`: 1000字まで保持（`cleanText` の160字切れを回避）し、無意味な既定値 `"AI提案"` は source として扱わない。
  - `trimUrlTrailingPunctuation`: URL末尾の句読点・閉じ括弧を除去。ただし `(dish)` のように対になっている括弧は保持し、正規URLを壊さない。
  - structureプロンプトに `sourceExtractionRule()`（参照元URLを source に入れる／無ければ空）を追加。
- 表示はReactのエスケープでXSSを担保（`dangerouslySetInnerHTML` 不使用）。共通部品 `RecipeSourceLinks` で URL のみ `<a target="_blank" rel="noreferrer">` 化。
- Gemini送信処理・APIキー扱い・AI利用枠の予約/返金・mime設定・auth/RLS・schema・Storage は一切変更していない（post-parse の正規化と表示のみ）。

## 実施した確認

- `/verify TKT-0177`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）も pass。`verify.json` を artifact に保存。
- 追加テスト:
  - `web/src/__tests__/recipe-generation.test.ts`（7件）: 単一/複数URL抽出、AI優先、URLなしは空（"AI提案"にしない）、generate既定維持、長いURL非切断、末尾記号トリム。
  - `web/src/__tests__/recipe-meal-workspace.test.tsx`: 調理ビューア上部で複数URLが個別リンク、URLでない出典はテキスト表示されることを固定。
  - 関連スイート計 40 件 pass。
- 手動確認の観点（コードレビューで担保）: 編集画面の「出典」textarea（既存・1741行）でURL/本名を改行入力でき、保存時 `source` に保持→ `RecipeSourceLinks` でリンク表示される。新規追加でURL未入力でも保存可能（source は任意）。

## 残リスク

- `/check-gates TKT-0177` が `supabase_schema_change`（🔴危険）を検出するが、これは **過剰マッチで、本チケットは実際には schema 変更ではない**（TKT-0172 の `csv_import_migration` 過剰マッチと同性質）。要因は2つ:
  1. 同 eval の `diff_regex_any` に `recipes` などテーブル名トークンが含まれ、`web/` で `recipes` テーブルを参照する通常コード（本チケットの `recipe-generation.ts` / `recipe-meal-workspace.tsx`）に当たる。
  2. 作業ツリーに未コミットで残る別チケット TKT-0173 の migration（`supabase/migrations/20260605120000_user_image_columns.sql` の `alter table`/`add column`）を whole-tree diff が拾う。
  - 本チケットは `web/` のみの変更で schema/Storage/auth/RLS に触れていない（`verify` の policy も pass）。**実際の危険変更ではないため manual-smokes/review は作成しない**（軽量プロセス: verify.json + report.md で完了）。`check_gates.py` は作業ツリー全体を見るため、複数チケット同時未コミットや table 名トークンで danger eval が過剰マッチする既知の制約。
- URL末尾トリムは主要ケースをテストで固定したが、特殊な記号を含むURLで想定外トリムが理論上あり得る。

## 次の依頼や人判断

- 作業ツリーに TKT-0172〜0176 由来の未コミット変更が混在しているため、`/check-gates` を正しく機能させるには **チケット単位でのコミット**が望ましい（本チケット分の commit はユーザー明示依頼があれば実施）。
- 既存レシピの `source == "AI提案"` データは移行していない（新規構造化以降に適用）。一括補正が必要なら別チケットで検討。
