---
id: TKT-0151-ai-daily-usage-limit
title: Gemini AI利用の1日回数制限
status: ready
goal: アカウント乗っ取りや誤操作が起きても、Gemini AI機能を短時間に大量利用されないようにする
acceptance:
  - SupabaseにAI利用記録テーブルまたは同等の記録仕組みが追加されている
  - 利用記録はユーザーごと・日ごと・機能ごとに残る
  - AIレシピ生成は1日20回までに制限される
  - 食材写真解析は1日10回までに制限される
  - Gemini AI利用の合計は1日30回までに制限される
  - 上限超過時はGemini APIへ送信せず、原因・影響・修正方法が分かるエラーを表示する
  - UIで本日の残り回数または上限到達状態が分かる
  - `ai_usage_events` 相当の記録はRLSで本人分だけ読める/書ける
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - supabase/
  - web/src/app/api/ai/recipes/route.ts
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/ai/
  - web/src/__tests__/
  - project-os/artifacts/TKT-0151/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0151-ai-daily-usage-limit
related_artifacts:
  - artifacts/TKT-0151/verify.json
  - artifacts/TKT-0151/manual-smokes.md
  - artifacts/TKT-0151/review.md
  - artifacts/TKT-0151/report.md
owner_role: implementer
owner_notes:
  - 危険変更（supabase_schema_change / auth_and_rls_policy / ai_server_route）。Supabase migration、RLS、AI API routeを触るため manual-smokes.md / review.md を必須にする
  - ブラウザのlocalStorageだけで回数制限しない。必ずSupabase側で記録・判定する
  - Gemini APIキーは記録テーブルに保存しない。ログ、エラー、レスポンスにも含めない
  - 上限判定はGemini送信前に行う。上限超過時はGemini APIへ通信しない
  - 同時連打で上限を超えにくいよう、可能ならPostgres関数で「確認と記録」をまとめる
---

# Summary

Gemini AI機能にユーザーごとの日次利用上限を追加する。

## 実装メモ

- Supabase
  - `ai_usage_events` 相当のテーブルを追加する。
  - `user_id`, `feature`, `usage_date`, `created_at` を持たせる。
  - RLSを有効にし、本人分だけselect/insertできるようにする。
  - update/deleteは不要なら許可しない。
- AI API route
  - `recipes/route.ts` は `recipe_generation` として判定する。
  - `scan-ingredients/route.ts` は `ingredient_scan` として判定する。
  - Geminiへfetchする前に、当日の機能別回数と合計回数を確認する。
  - 上限内なら記録してからGeminiへ送る。
  - 上限超過なら400系または429で止める。
- UI
  - AIレシピ生成UIと食材写真解析UIの近くに、本日の残り回数を表示する。
  - 上限到達時はボタンを押せない、または押した時に分かりやすく止める。

## 推奨上限

- `recipe_generation`: 20回/日
- `ingredient_scan`: 10回/日
- total: 30回/日

## 手動確認

- 上限未満ではAIが動く。
- レシピ生成21回目は止まる。
- 食材写真解析11回目は止まる。
- 合計31回目は止まる。
- 別ユーザーの回数とは分離される。
- スマホ表示で残り回数が見やすい。

## 残リスク

- 利用記録を「Gemini送信前」に残す場合、Gemini側エラーでも1回として数える。乱用防止を優先するため、この挙動は許容する。
- 日付境界は実装時にUTC/JSTのどちらで数えるか決める。ユーザー体験としてはJSTが自然だが、DB実装はUTCのほうが単純。仕様との差が出ないようdocsに明記する。
