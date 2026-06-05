---
id: TKT-0177-web-recipe-source-url-on-ai-structure
title: テキストからレシピ追加のAI構造化で参照元URLを保持・表示（Canvas版に合わせる）
status: completed
goal: URL込みのレシピ本文を「AIで構造化」した際にリンクが消える不具合を直し、Canvas版同様にsourceへURLを保持し詳細画面でリンク表示する
acceptance:
  - structureモードでAIがsourceを返さない場合、入力本文から `https?://...` を抽出して source に保持する（複数は改行区切り・ユニーク化）
  - AIがsource(URL)を返した場合はそれを優先する
  - 本文にURLが無い場合は source を空にする（"AI提案" で埋めない）
  - generateモードは従来どおり source 既定 "AI提案" を維持する
  - 長いURL/複数URLが160字で切られない
  - 調理ビューア上部とレシピ詳細「参考元」で、sourceを改行分割し各URLをリンク、それ以外はテキスト表示する
  - Gemini APIキー扱い・AI利用枠の予約/返金・auth/RLS・schema・Storage を変更しない
  - Web版verifyが通る
required_evals:
  - ai_server_route
eval_selection_mode: auto
changed_paths:
  - web/src/lib/ai/recipe-generation.ts
  - web/src/app/api/ai/recipes/route.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0177-web-recipe-source-url-on-ai-structure/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0177-web-recipe-source-url-on-ai-structure
related_artifacts:
  - artifacts/TKT-0177-web-recipe-source-url-on-ai-structure/verify.json
  - artifacts/TKT-0177-web-recipe-source-url-on-ai-structure/report.md
owner_role: implementer
owner_notes:
  - 参照: Canvas版 `app.html` の source 抽出（6677-6682行）と詳細上部リンク表示（8064-8076行）に挙動を合わせる。Canvas版は編集しない。
  - `ai_server_route` eval は `/api/ai/recipes` を触るため形式上マッチするが、変更は **parse後の source 正規化と表示のみ**。Gemini送信・キー扱い・usage予約/返金・mime設定は不変更（セキュリティ/quota境界に影響しない）。このためデータ削除/移行・認証境界の変更を伴わず、本チケットでは manual-smokes/review を必須化しない（report に手動スモーク結果を記載）。
  - APIキー・秘密情報を直書きしない。console.log を残さない。XSSは React のエスケープで担保（dangerouslySetInnerHTML 不使用）。
  - 既存レシピの `source == "AI提案"` データは移行しない（新規構造化以降に適用）。
  - verify は `/verify TKT-0177`。
---

# Summary

「テキストからレシピを追加」の「AIで構造化」で、URL込み本文を貼り付けてもリンクが残らない不具合を、Canvas版と同じ挙動に合わせて修正する。AI構造化時に参照元URLを `source` に保持し（複数は改行区切り）、レシピ詳細上部で各URLをリンク表示する。

## 背景

- 現状 Web版は AI構造化プロンプトに source 抽出指示がなく、`normalizeRecipe` が `cleanText(raw.source) || "AI提案"` のため、貼り付けたURLが消えていた。
- Canvas版は「AIのsource優先＋本文からの正規表現URL抽出フォールバック」を持ち、詳細上部に複数URLをリンク表示していた。
- 調査の経緯と方針はプラン `url-ai-ai-sleepy-rain` を参照。

## 実装メモ

- `recipe-generation.ts`: structureプロンプトに source 抽出指示を追加。`parseGeminiRecipeResponse(response, { mode, sourceText })` に拡張し、`resolveSource` で AI優先＋本文URL抽出フォールバック。`sanitizeSource`（1000字・"AI提案"除外）、`trimUrlTrailingPunctuation`（対の括弧は保持）。
- `route.ts`: parse呼び出しに `{ mode, sourceText }` を渡す。
- `recipe-meal-workspace.tsx`: 共通部品 `RecipeSourceLinks`（改行分割→URLはリンク/それ以外はテキスト）を調理ビューア上部とレシピ詳細に適用。`globals.css` に表示スタイル追加。
- テスト: `recipe-generation.test.ts`（7件）＋ workspace の複数URLリンク描画テスト。

### 共通方針
- GAS/Spreadsheet/Drive を使わない。APIキーを直書きしない。RLS/Storage/schema を変更しない。

## 残リスク

- `ai_server_route` eval は形式上マッチするが実態は post-parse 正規化と表示のみ（セキュリティ/quota境界に影響なし）→ report に明記。
- URL末尾トリムの判定は対の括弧を保持する実装だが、特殊なURLでの想定外トリムが理論上あり得る（テストで主要ケースを固定）。
