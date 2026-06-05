---
id: SPEC-0177-web-recipe-source-url-on-ai-structure
title: AI構造化時の参照元URL保持と詳細画面でのリンク表示（Canvas版整合）
status: ready
scope:
  - レシピ「テキストから追加」→「AIで構造化」の source 抽出（サーバ側 `/api/ai/recipes`）
  - 調理ビューア上部・レシピ詳細「参考元」での source 表示
constraints:
  - 触らない範囲: Gemini送信処理・APIキー扱い・AI利用枠の予約/返金・mime設定・auth/RLS・schema・Storage
  - Canvas版 `app.html` は凍結・参照専用（編集しない。挙動の参照のみ）
  - APIキー非露出。XSSは React のエスケープで担保（dangerouslySetInnerHTML 不使用）
acceptance:
  - structureモードでAIがsource未返却なら本文から `https?://...` を抽出して保持（複数は改行区切り・ユニーク化）
  - AIがsource(URL)を返した場合はそれを優先
  - 本文にURLが無ければ source は空（"AI提案" で埋めない）
  - generateモードは source 既定 "AI提案" を維持
  - 160字でURLが切れない
  - 詳細表示で source を改行分割し、各URLはリンク（target=_blank rel=noreferrer）、それ以外はテキスト
related_tickets:
  - TKT-0177-web-recipe-source-url-on-ai-structure
---

# Summary

URL込みのレシピ本文を「AIで構造化」してもリンクが消える不具合を、Canvas版と同じ挙動に合わせて解消する正本仕様。

## 背景

- Web版は AI構造化プロンプトに source 抽出指示がなく、`normalizeRecipe` の `cleanText(raw.source) || "AI提案"` で貼り付けURLが失われていた。
- Canvas版（`app.html` 6677-6682）は「AIのsource優先＋本文からの正規表現URL抽出フォールバック」を持ち、詳細上部（8064-8076）で複数URLをリンク表示していた。

## 仕様

- 抽出: structureモードで `source` が空（または "AI提案"）の場合、入力本文を `https?://[^\s]+` で全URL抽出し、末尾の句読点・対でない閉じ括弧を除去、ユニーク化して改行結合。
- 保持上限: source は 1000 字（URL/複数URLを切らない）。
- 表示: source を改行分割し、`^https?://` はリンク、それ以外はテキスト。調理ビューア上部とレシピ詳細「参考元」の両方に適用。

## 非対象

- 既存レシピの `source == "AI提案"` データ移行（新規構造化以降に適用）。
- source を複数列に分割するスキーマ変更（string 改行区切りで維持）。

## Acceptance Example

- `project-os/artifacts/TKT-0177-.../verify.json` が pass。
- `recipe-generation.test.ts` で抽出ロジック、`recipe-meal-workspace.test.tsx` で複数URLリンク描画を固定。
