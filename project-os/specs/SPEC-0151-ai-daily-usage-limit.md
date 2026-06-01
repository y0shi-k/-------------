---
id: SPEC-0151-ai-daily-usage-limit
title: Gemini AI利用の1日回数制限
status: spec_ready
scope:
  - supabase/
  - web/src/app/api/ai/
  - web/src/components/
  - web/src/lib/ai/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Gemini APIキーをDBへ保存しない
  - 利用回数はブラウザ保存だけに頼らず、Supabase側で記録する
  - AI上限超過時はGemini APIへリクエストを送らない
  - 既存のRLS本人分離を維持する
acceptance:
  - Gemini AI利用がユーザーごと・日ごと・機能ごとに記録される
  - レシピ生成は1日20回までに制限される
  - 食材写真解析は1日10回までに制限される
  - Gemini AI利用の合計は1日30回までに制限される
  - 上限到達時はGemini APIへ送信せず、原因・影響・修正方法が分かるエラーを返す
  - UIで本日の残り回数または上限到達状態が分かる
  - 利用記録テーブルはRLSで本人分だけ読める/書ける
  - Web版verifyが通る
related_tickets:
  - TKT-0151-ai-daily-usage-limit
---

# Summary

アカウント乗っ取りや誤操作への保険として、Gemini AI機能に1日あたりの利用回数制限を入れる。

制限はブラウザ内だけでなくSupabaseに記録し、Next.jsのAI API routeでGemini送信前に判定する。

## 背景

Gemini APIキーをユーザー持ちにしても、乗っ取られたアカウントや保存済みブラウザからAI機能を連打される可能性がある。費用・悪用・誤操作を抑えるため、サーバー側で日次上限を設ける。

## 仕様

### 上限

- AIレシピ生成: 1日20回まで
- 食材写真解析: 1日10回まで
- 合計AI利用: 1日30回まで

### 記録

- Supabaseに利用記録テーブルを追加する。
- テーブル名候補: `ai_usage_events`
- 保存項目:
  - `id`
  - `user_id`
  - `feature`
  - `usage_date`
  - `created_at`
- `feature` は少なくとも次を扱う。
  - `recipe_generation`
  - `ingredient_scan`

### 判定

- `web/src/app/api/ai/recipes/route.ts`
  - Gemini送信前に、当日の `recipe_generation` 回数と合計回数を確認する。
  - 上限内なら利用記録を追加してからGeminiへ送る。
- `web/src/app/api/ai/scan-ingredients/route.ts`
  - Gemini送信前に、当日の `ingredient_scan` 回数と合計回数を確認する。
  - 上限内なら利用記録を追加してからGeminiへ送る。

実装時は、同時連打で上限を超えにくい設計を優先する。必要ならPostgres関数で「確認と記録」を1回の処理にまとめる。

### エラー

上限超過時はGemini APIへ送らず、次の形の分かりやすいエラーを返す。

- 原因: 本日のAI利用上限に達しました。
- 影響: 今日はこのAI機能を実行できません。
- 修正方法: 明日再度お試しください。

### UI

- AIレシピ生成と食材写真解析の近くに、本日の残り回数または上限到達状態を表示する。
- スマホでも邪魔にならない小さな表示にする。

## RLS

- `ai_usage_events` はRLSを有効にする。
- 本人の利用記録だけselectできる。
- insertは `auth.uid() = user_id` のときだけ許可する。
- update/deleteは原則不要。必要がなければ許可しない。

## 非対象

- Gemini APIキーのユーザー持ち化そのもの（SPEC-0150）
- 課金プラン別の上限変更
- 管理画面での利用履歴集計
- IP単位のBot対策

## 手動確認

- 上限未満ではAIレシピ生成が動く。
- レシピ生成20回到達後は、21回目がGeminiへ送られず止まる。
- 食材写真解析10回到達後は、11回目がGeminiへ送られず止まる。
- 合計30回到達後は、どちらのAI機能も止まる。
- 別ユーザーの利用回数に影響されない。
- スマホ幅で残り回数表示が崩れない。
