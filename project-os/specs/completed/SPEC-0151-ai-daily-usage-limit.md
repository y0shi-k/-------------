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
  - `ai_usage_events` への書き込みは SECURITY DEFINER 関数経由とし、直接 insert/update/delete はRLSで閉じる
acceptance:
  - Gemini AI利用がユーザーごと・日ごと（JST基準）・機能ごとに記録される
  - レシピ生成は1日20回までに制限される
  - 食材写真解析は1日10回までに制限される
  - Gemini AI利用の合計は1日30回までに制限される
  - 上限判定はGemini送信前に「原子的な予約」で行い、同時連打でも上限を超えない
  - Gemini通信失敗・写真取得失敗時は予約が返金され、当日枠を消費しない
  - 上限到達時はGemini APIへ送信せず、どの上限（機能別か合計か）に達したか分かる429エラーを返す
  - UIで機能別の残り回数と合計残り回数、上限到達状態が分かる
  - 利用記録テーブルはRLSで本人分だけselectでき、書き込みは関数経由に限定される
  - refund は本人の直近予約だけ取り消せ、過去の記録を削除して上限をリセットできない
  - Web版verifyが通る
related_tickets:
  - TKT-0151-ai-daily-usage-limit
---

# Summary

Gemini AI機能に1日あたりの利用回数制限を入れる。TKT-0150でAPIキーがユーザー持ちになったため、上限の主目的は「運営者費用の抑制」ではなく、**乗っ取り・誤操作・連打時に本人のGemini課金が暴走するのを防ぐ安全ネット**である。

制限はブラウザ内だけでなくSupabaseに記録し、Next.jsのAI API routeがGemini送信前に**原子的に1回分を予約**して判定する。Geminiが通信失敗したら予約を返金し、枠を無駄に消費しない。

## 背景

Gemini APIキーをユーザー持ちにしても、乗っ取られたアカウントや保存済みブラウザからAI機能を連打される可能性がある。費用（ユーザー自身のGoogle課金）・悪用・誤操作を抑えるため、サーバー側で日次上限を設ける。判定はクライアントに任せず、Supabaseの原子的処理で行う。

## 仕様

### 上限

- AIレシピ生成: 1日20回まで
- 食材写真解析: 1日10回まで
- 合計AI利用: 1日30回まで

上限値は **SQL関数内に単一ソースで定義**する。コード側に二重定義せず、UIの残り表示はサマリ関数の戻り値を使う。プラン別の可変上限・課金連動は非対象。

### 日付境界

`usage_date` は **JST（Asia/Tokyo）基準の暦日**で数える。ユーザー体験として「1日」が日本時間で自然なため。SQL関数内で `(now() at time zone 'Asia/Tokyo')::date` を使う。

### 記録

- Supabaseに利用記録テーブル `ai_usage_events` を追加する。
- 保存項目:
  - `id`
  - `user_id`
  - `feature`（`recipe_generation` / `ingredient_scan`）
  - `usage_date`（JST暦日）
  - `created_at`
- インデックスは `(user_id, feature, usage_date)` と `(user_id, usage_date)` を張る。

### 判定（予約＋失敗時返金）

- Gemini送信前に **原子的な予約（確認＋insert）** を行う。
  - 同一ユーザーの並行実行は `pg_advisory_xact_lock(hashtext(uid))` で直列化し、当日の機能別件数・合計件数を確認して上限内なら1行insertする。
  - 上限内: `event_id` と残り回数を返す。
  - 上限超過: insertせず、`feature_limit` / `total_limit` のどちらに達したかを返す。
- `web/src/app/api/ai/recipes/route.ts`
  - 認証後・Gemini送信前に `recipe_generation` を予約する。超過なら429。
- `web/src/app/api/ai/scan-ingredients/route.ts`
  - 認証後・**写真ダウンロードより前**に `ingredient_scan` を予約する。超過なら429（Storage I/Oを行わない）。
- 返金:
  - Geminiが **通信失敗（`!response.ok`）** または **写真取得失敗** の場合、予約を返金（その行を削除）して当日枠を消費しない。
  - Geminiが **ok応答した後のparse失敗（422）は消費したまま**にする（GoogleのAI quotaは実際に消費されているため）。
  - 返金は SECURITY DEFINER 関数で、**本人の直近予約のみ**（時間制限付き、例: 5分以内）削除できる。過去履歴を削除して上限をリセットすることはできない。

### エラー

上限超過時はGemini APIへ送らず、どの上限に達したか分かるエラーを429で返す。

- 原因: 本日のAI利用上限（機能別／合計）に達しました。
- 影響: 今日はこのAI機能を実行できません。
- 修正方法: 明日再度お試しください。

### UI

- AIレシピ生成と食材写真解析の近くに、**機能別の残り回数と合計残り回数の両方**を表示する。
- 二重上限の境界を正しく扱う:
  - 機能別が0 → その機能のボタンのみ無効化。
  - 合計が0 → 両方のボタンを無効化（合計上限と明示）。
- 無効化時はボタン非活性＋短い理由文を出す。
- 取得タイミング: マウント時に読み、各AI実行（成功・429いずれも）後に再取得して更新する。
- スマホでも邪魔にならない小さな表示（1行コンパクト、必要なら折り返し）にする。

## RLS / 関数

- `ai_usage_events` はRLSを有効にする。
  - select: `auth.uid() = user_id` の本人分のみ。
  - insert / update / delete の直接ポリシーは作らない（直接書き込み不可）。
- 書き込みは SECURITY DEFINER 関数経由:
  - `consume_ai_usage(p_feature)`: 確認＋予約（insert）。`auth.uid()` を強制し `search_path` を固定。
  - `refund_ai_usage(p_event_id)`: 本人の直近予約のみ削除。
  - `get_ai_usage_summary()`: 当日の機能別／合計の used・limit・remaining を返す（UI用）。

## 非対象

- Gemini APIキーのユーザー持ち化そのもの（SPEC-0150）
- 課金プラン別の上限変更
- 管理画面での利用履歴集計
- `ai_usage_events` の古い行の定期削除（将来チケット）
- IP単位のBot対策

## 手動確認

- 上限未満ではAIレシピ生成が動く。
- レシピ生成20回到達後は、21回目がGeminiへ送られず止まる（機能別429）。
- 食材写真解析10回到達後は、11回目がGeminiへ送られず止まる（機能別429）。
- 合計30回到達後は、どちらのAI機能も止まる（合計429）。
- Gemini側を失敗させた場合、当日の残り回数が戻る（返金）。
- 別ユーザーの利用回数に影響されない。
- スマホ幅で機能別＋合計の残り回数表示が崩れない。
