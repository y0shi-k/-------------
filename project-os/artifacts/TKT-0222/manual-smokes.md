---
ticket_id: TKT-0222-ingredient-name-match-util
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- photo_upload_storage / supabase_schema_change は、同一作業ツリー上の他チケット（TKT-0219〜0221）の diff 語彙による自動マッチ。本チケットの実変更は新規ファイル2点（純粋ロジック＋テスト）のみで、Storage・schema の挙動変更はない。

## executed_checks

- ユニットテスト45件（vitest）: 正規化（NFKC/小文字/空白/カナ→かな/長音保持/半角カナ）、辞書一致（卵・玉ねぎ・じゃがいも等の相互一致）、false ケース（無関係・ピーマン/パプリカ・部位違い）、部分一致が matches=true にならない固定、スコア序列 4>3>2>1>0。
- `npx tsc --noEmit` で型エラーなし。`npm run build` 通過。
- コードレビューで以下を確認:
  - 既存ファイルへの変更ゼロ（`git status` で新規2ファイルのみ）。
  - 画像用 `normalizeIngredientName`（`ingredient-image.ts`）の流用・変更なし。
  - UIへの結線なし（適用は TKT-0223/0224）。

## skipped_checks

- 実機・実ブラウザ確認（本チケットは UI 非接続の純粋ロジックのため対象なし。UI 適用後の TKT-0223/0224 で確認する）。

## open_risks

- なし（表示・データへの影響が発生するのは適用チケット以降）。
