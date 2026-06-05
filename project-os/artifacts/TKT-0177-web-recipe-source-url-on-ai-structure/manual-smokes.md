---
ticket_id: TKT-0177-web-recipe-source-url-on-ai-structure
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `supabase_schema_change`（🔴危険）: `/check-gates` で過剰マッチした eval。本チケットは実 schema/Storage/auth 変更を含まないため、実行系スモークではなく**静的確認（static_only）**で代替する。
- `photo_upload_storage`（🔴危険）: `image`/`画像` 等のトークン（`RecipeThumb imageUrl` 等の既存コードや artifact 文言）に当たった過剰マッチ。本チケットは画像取り込み・圧縮・Storage 保存を**一切変更しない**ため static_only で代替する。

## executed_checks

- diff を確認し、`supabase/` への変更・`create/alter table`・`create policy`・`enable row level security`・Storage 操作が本チケットに**無い**ことを確認。
- `verify.json` の policy（`no_gas_dependency` / `no_hardcoded_secret` / `supabase_rls_present`）が全 pass であることを確認。
- 自動テストで AI構造化の source 抽出（単一/複数URL・AI優先・URLなしは空・generate既定維持・長いURL非切断・末尾記号トリム）と、複数URLのリンク描画を固定（`recipe-generation.test.ts` 7件 / `recipe-meal-workspace.test.tsx` の複数URLリンクテスト）。

## skipped_checks

- 実DB・実Storageに対するスモークは**対象外**（本チケットは DB/Storage を変更しないため。eval は過剰マッチ）。
- ブラウザ実機での「URL込み本文を貼付→AIで構造化→出典にURL→保存→調理ビューア上部/詳細でリンク表示」のhappy-path目視は**ユーザー残課題**（Gemini APIキーが必要なため自動化対象外）。

## open_risks

- 実機目視が未実施のため、Gemini 応答の実フォーマット差異による source 抽出の取りこぼしは残課題（テストはモック応答で固定）。
- 既存 `source == "AI提案"` データの一括補正要否は別途判断。
