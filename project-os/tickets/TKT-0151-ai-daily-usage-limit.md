---
id: TKT-0151-ai-daily-usage-limit
title: Gemini AI利用の1日回数制限
status: completed
goal: 乗っ取りや誤操作・連打が起きても、Gemini AI機能をサーバー側で1日上限まで原子的に制限し、ユーザー自身のGemini課金が暴走しないようにする
acceptance:
  - Supabaseに `ai_usage_events` テーブルが追加され、RLSが有効になっている
  - 利用記録はユーザーごと・日ごと（JST基準）・機能ごとに残る
  - AIレシピ生成は1日20回までに制限される
  - 食材写真解析は1日10回までに制限される
  - Gemini AI利用の合計は1日30回までに制限される
  - 上限判定はGemini送信前に「原子的な予約」で行い、同時連打でも上限を超えない
  - Gemini通信失敗・写真取得失敗時は予約が返金され、当日枠を消費しない
  - 上限超過時はGemini APIへ送信せず、どの上限（機能別か合計か）に達したか分かる429エラーを返す
  - UIで機能別の残り回数と合計残り回数、上限到達状態が分かる（到達した機能のボタンは押せない）
  - `ai_usage_events` への書き込みは SECURITY DEFINER 関数（consume/refund）経由で、直接 insert/update/delete はRLSで禁止されている
  - refund は本人の直近予約だけを取り消せ、過去の記録を削除して上限をリセットできない
  - Gemini APIキーは記録テーブル・ログ・エラー・レスポンスに含まれない
  - Web版verifyが通る
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - supabase/migrations/
  - web/src/app/api/ai/recipes/route.ts
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/lib/ai/
  - web/src/components/ai-usage-meter.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
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
  - 「確認＋予約」と「返金」は SECURITY DEFINER の Postgres関数にまとめ、直接の insert/update/delete はRLSで閉じる
  - TKT-0150 で同じ2本のAI routeを直近変更済み。本チケットはその上に上限判定を足す（コンフリクトなし）
---

# Summary

Gemini AI機能にユーザーごとの日次利用上限を追加する。TKT-0150でAPIキーがユーザー持ちになったため、上限の主目的は「運営者費用の抑制」ではなく、**乗っ取り・誤操作・連打時に本人のGemini課金が暴走するのを防ぐ安全ネット**である。

判定はブラウザではなくSupabaseで行い、Next.jsのAI API routeがGemini送信前に**原子的に1回分を予約**する。Geminiが通信失敗したら予約を返金し、枠を無駄に消費しない。

---

# 決定事項（実装前に確定）

過去の評価で挙がった論点を以下の方針で確定する。

### #1 上限値と脅威モデル
- 上限は **recipe_generation 20回/日、ingredient_scan 10回/日、合計 30回/日** を維持する。
- キーがユーザー持ちになった結果、使いすぎのコストは**ユーザー自身のGoogle課金**である。本上限は「課金暴走の安全ネット」であり、運営者費用の制限ではないと位置づける。
- 上限値は **SQL関数内に単一ソースで定義**する（コード側に二重定義しない）。残り回数はサマリ関数の戻り値からUIが受け取り、UI側に上限値をハードコードしない。
- プラン別の可変上限・課金連動は **非対象**（将来チケット）。

### #2 / #3 失敗時の扱いと連打耐性（採用: 予約＋失敗時返金）
- Gemini送信前に **原子的な予約（確認＋insert）** を行い、同時連打でも上限を超えないようにする。
- Geminiが **通信失敗（`!response.ok`）または写真取得失敗** の場合は、予約を **返金（その行を削除）** して当日枠を消費しない。
- Geminiが **ok応答した場合は、後続のparse失敗（422）でも消費したまま**にする（GoogleのAI quotaは実際に消費されているため）。
- 返金は SECURITY DEFINER 関数で **本人の直近予約のみ**（時間制限付き）削除できる。ユーザーが過去の記録を削除して上限をリセットすることはできない。

### #4 ルート内での判定位置
- 両ルートとも **認証（getUser）成功後・Gemini送信前** に予約する。
- `scan-ingredients` では **写真ダウンロードより前**に予約し、上限超過時はStorage I/Oを行わない。ダウンロード失敗時は予約を返金する。
- 既存の「APIキー未入力 → 400」「未認証 → 401」チェックは先に通す（無駄な記録を作らない）。

### #5 残り回数UI（改良）
- 機能別の残りと合計残りを **両方** 表示する（例: `本日のAI 残り｜レシピ 18/20・写真 9/10・合計 27/30`）。
- 二重上限の境界を正しく扱う:
  - 機能別が0 → その機能のボタンのみ無効化。
  - 合計が0 → 両方のボタンを無効化（「本日のAI合計上限」と明示）。
- 無効化時はボタン非活性＋短い理由文（どの上限に達したか）を表示する。
- 取得タイミング: マウント時に1回読み、各AI実行（成功・429いずれも）後に再取得して表示を更新する。
- スマホ幅では1行コンパクト表示（必要なら折り返し）。レイアウトを押し広げない小さなバッジにする。

### 日付境界
- `usage_date` は **JST（Asia/Tokyo）基準の暦日**で数える。ユーザー体験として「1日」が日本時間で自然なため。SQL関数内で `(now() at time zone 'Asia/Tokyo')::date` を使う。

---

# 実装メモ

## Supabase（migration）

`ai_usage_events` テーブル:

```sql
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('recipe_generation','ingredient_scan')),
  usage_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_events_user_feature_date_idx
  on public.ai_usage_events (user_id, feature, usage_date);
create index if not exists ai_usage_events_user_date_idx
  on public.ai_usage_events (user_id, usage_date);
```

RLS（select本人のみ。書き込みは関数経由のみ）:

```sql
alter table public.ai_usage_events enable row level security;
create policy "ai_usage_events_select_own" on public.ai_usage_events
  for select using (auth.uid() = user_id);
-- insert / update / delete の直接ポリシーは作らない（= 直接書き込み不可）
```

関数（すべて `security definer`、`search_path` を固定、上限値はここで単一定義）:

- `consume_ai_usage(p_feature text) returns json`
  - `auth.uid()` を取得（null なら拒否）。
  - 同一ユーザーの並行実行を直列化するため、先頭で `pg_advisory_xact_lock(hashtext(uid::text))`。
  - JST当日の機能別件数と合計件数を数え、上限内なら1行insertして `event_id` を返す。
  - 戻り値: `{ ok, event_id, reason, remaining_feature, remaining_total }`。`reason` は超過時に `feature_limit` / `total_limit` を返し、429メッセージとUIで使う。
- `refund_ai_usage(p_event_id uuid) returns boolean`
  - `delete ... where id = p_event_id and user_id = auth.uid() and created_at > now() - interval '5 minutes'`。
  - 直近の自分の予約だけ取り消せる（過去履歴の削除でリセット不可）。
- `get_ai_usage_summary() returns json`
  - JST当日の機能別used/limit/remaining と合計used/limit/remaining を返す。UIの残り表示はこれを使う。

## AI API route

- `recipes/route.ts`（`recipe_generation`）:
  1. 既存の入力チェック → APIキー未入力 → 認証チェック。
  2. `consume_ai_usage('recipe_generation')`。`ok=false` なら `reason` に応じた429を返す（Geminiへ送らない）。
  3. Gemini送信。`!ok` なら `refund_ai_usage(event_id)` してから502。
  4. parse失敗（422）は消費したまま。
- `scan-ingredients/route.ts`（`ingredient_scan`）:
  1. 既存の入力/APIキー/認証チェック。
  2. **写真ダウンロード前**に `consume_ai_usage('ingredient_scan')`。超過なら429。
  3. ダウンロード失敗 → `refund_ai_usage` してから500。
  4. Gemini送信。`!ok` → `refund_ai_usage` してから502。
- 共通: 予約・返金の失敗やRPCエラーでもAPIキー値はログ/レスポンス/エラーに出さない。

## lib / UI

- `web/src/lib/ai/usage.ts`: `consumeAiUsage` / `getAiUsageSummary` のクライアント側ラッパ（supabase.rpc）と型。上限値はここに持たず、サマリ戻り値を使う。
- `web/src/components/ai-usage-meter.tsx`: 機能別＋合計の残り表示バッジ（#5）。レシピ生成UIと写真解析UIの近くに置く。
- `inventory-board.tsx` / `recipe-meal-workspace.tsx`: メーター設置、上限到達時のボタン無効化、AI実行後の再取得。

## テスト

- `consume` 関数: 上限未満で記録、機能別上限で停止、合計上限で停止、別ユーザーと分離。
- 連打耐性: 並行/連続呼び出しで上限を超えないこと（少なくとも直列の境界ケース）。
- 返金: Gemini通信失敗・ダウンロード失敗で予約が消える／ok時は残る。
- route: 超過時にGeminiへfetchしないこと、429の `reason` が機能別/合計で分岐すること。
- APIキーがレスポンス・記録・エラーに含まれないこと（TKT-0150のテスト方針を踏襲）。
- UI: 機能別0で該当ボタン無効、合計0で両方無効。

---

# 推奨上限

- `recipe_generation`: 20回/日
- `ingredient_scan`: 10回/日
- total: 30回/日

---

# 手動確認

- 上限未満ではAIが動く。
- レシピ生成21回目は止まる（429・機能別）。
- 食材写真解析11回目は止まる（429・機能別）。
- 合計31回目は止まる（429・合計）。
- Gemini側を失敗させた場合、当日の残り回数が戻る（返金）。
- 別ユーザーの回数とは分離される。
- スマホ表示で機能別＋合計の残り回数が見やすい。

---

# 残リスク

- 返金は「Geminiが通信失敗（未処理）」のみ対象。Geminiがok応答後にparse失敗した場合は、Google quotaを実際に消費しているため消費扱いのままとする。
- `advisory lock` ＋条件付きinsertで連打超過は防ぐが、極端な高並行時はロック待ちが増える可能性がある。MVP想定の利用量では問題にならない見込み。
- `ai_usage_events` は1人あたり最大30行/日で増え続ける。当面は問題ないが、将来の保全（古い行の定期削除）は別チケットで検討する。
- refund関数の時間制限（5分）は、長時間かかるGemini応答を考慮した値。実装時に実際の最大応答時間と整合するか確認する。
