---
ticket_id: TKT-0151
status: passed
review_scope:
  - SPEC-0151-ai-daily-usage-limit
  - TKT-0151-ai-daily-usage-limit
---

# TKT-0151 review

## checked_diff_paths

- `supabase/migrations/20260602120000_ai_usage_events.sql`
- `web/src/app/api/ai/recipes/route.ts`
- `web/src/app/api/ai/scan-ingredients/route.ts`
- `web/src/lib/ai/usage.ts`
- `web/src/components/ai-usage-meter.tsx`
- `web/src/components/inventory-board.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/ai-usage.test.ts`
- `web/src/__tests__/ai-usage-meter.test.tsx`
- `web/src/__tests__/recipes-route.test.ts`
- `web/src/__tests__/scan-ingredients-route.test.ts`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`

## checked_artifacts

- `verify.json`: pass
- `manual-smokes.md`: passed
- `report.md`: ready

## subagent_usage

- 実装は impl-deep（Opus）に委譲。レビューはオーケストレーター側で migration・両AI route・libを実読して確認した。

## findings

重大な未解決問題は見つからない。確認したこと:

- **RLS/権限**: `ai_usage_events` は RLS有効、select 本人のみ。insert/update/delete の直接ポリシーなし。3関数は `security definer` + `set search_path = public, pg_temp`、`public/anon` を revoke し `authenticated` にのみ grant。直接書き込みは閉じている。
- **原子性（連打耐性）**: `consume_ai_usage` 先頭で `pg_advisory_xact_lock(hashtext(uid))` により同一ユーザーを直列化し、件数確認→条件付きinsertを同一トランザクションで実施。連打で上限を超えない設計になっている。
- **日付境界**: `(now() at time zone 'Asia/Tokyo')::date` でJST暦日を使用。決定事項どおり。
- **上限の単一ソース**: 上限値はSQL関数内のみに定義。lib（`usage.ts`）とUIはサマリ戻り値を使い、ハードコードしていない。
- **判定位置（決定#4）**: recipes は認証後・Gemini前に予約。scan は写真所有確認（404）後・**ダウンロード前**に予約。404（不在/他人の写真）ではスロットを消費しない精緻化が入っており、Storage I/O前の予約という要件も満たす。
- **返金（決定#2）**: 通信失敗（`!ok`）・ダウンロード失敗で `refund_ai_usage` を呼び枠を戻す。ok後のparse失敗（422）は消費維持。refund は本人・5分以内のみ削除で、履歴削除によるリセットを防止。
- **APIキー秘匿**: 予約/返金は feature・event_id のみ送受信。キーは記録テーブル・ログ・エラー・レスポンスに含まれない（既存テストの `not.toContain` を維持）。
- **UI（決定#5）**: 機能別＋合計の残りを表示。機能別0→該当ボタンのみ無効、合計0→両方無効。AI実行後に再取得。クライアントガードに加え正本はサーバー判定。
- Canvas版 `app.html` は未編集。対象は web/ + supabase/ のみ。

## open_risks

- 実Supabaseへの適用（`supabase db push`）は未実施。`advisory lock` を含む原子的予約とRLSの最終確認は実DBで行う必要がある。
- refundの5分制限は長時間Gemini応答時に返金不可となる。実運用の最大応答時間と要整合。
- 一部コンポーネントテストでマウント時の非同期state更新による React `act(...)` 警告が出る（全テストpass・CIに影響なし）。気になる場合は初回renderの `waitFor` 待ちで解消可能。
- `ai_usage_events` の行数増加（保全は別チケット）。

## verdict

review_ready: pass（`verify_passed` / `manual_smokes_done` / `review_ready` を満たす。実DB適用と実環境スモークは公開前の運用ゲートで実施する前提）
