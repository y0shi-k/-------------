---
ticket_id: TKT-0241-consumption-unit-conversion
status: passed
execution_mode: local_browser_e2e
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（ticket の required_evals）
- `/check-gates` の supabase_schema_change / photo_upload_storage は `inventory_items`・`cooking_consumption_events`・写真語彙トークンの過剰マッチ。実体はクライアントロジック＋読み書きクエリの値変更のみで、schema / policy / migration / Storage は無変更。

## executed_checks

**ローカルSupabase + Playwright のブラウザE2E（2026-06-12 実施・全green）**

環境構築手順（再現可能・learnings にも記録）:
1. OrbStack 起動 → `supabase start`（リポジトリの supabase/ 設定で起動）→ `supabase migration up`（未適用分のみ追加適用。db reset は不使用）
2. admin API（ローカルのデモ service key）でテストユーザー作成 → `public.profiles` を approved に UPDATE
3. シード: 豚コマ 5パック・unit_conversion `{"fromQty":1,"fromUnit":"パック","toQty":80,"toUnit":"g"}`・冷凍庫 / たまご 7個 / レシピ「スモークテスト酢豚風」（豚こま肉300g・卵3個）/ 晩の献立
4. `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<ローカルdemoキー> npx next dev -p 3100`（.env.local は読まない・シェル環境変数優先）
5. Playwright（/tmp/pw-smoke に一時インストール。リポジトリの package.json は非変更）でログイン → 献立スケジュール → 調理を開始 → 料理を完了する → 消費ダイアログ

確認結果:
- 豚こま肉行に「豚コマ / 5パック / 冷凍庫」が**自動選択**・初期消費量 300・単位セレクタ options [g, パック]・既定 g ✓
- 消費量 120（g）で確定 → DB: inventory_items.quantity = **3.5**（パック）、cooking_consumption_events = requested 300 g / **consumed 1.5 パック**（在庫単位保存）、meal_schedules.status = 完了 ✓
- ページ再読込後の在庫一覧で「**3 1/2パック**」（分数表示）＋換算ラベル「1パック = 80g」 ✓
- 卵 → たまご（同単位）の自動マッチ回帰なし。3個消費で 7→4個 ✓
- ブラウザ console.error なし（Playwright で監視）

加えて `bash harness/bin/verify_web.sh TKT-0241` 全pass（テスト153件 green 含む）。

## skipped_checks

- ユーザー実機（実データ・タブレット）での確認: 本番データは触らない方針のためユーザー側で実施（report.md「次の依頼や人判断」参照）
- 完了取り消し（巻き戻しで1.5パック復元）のブラウザ操作: 単体テスト（cooking-history-rollback.test.ts）で固定済みのためブラウザでは省略

## open_risks

- E2E中に確認: 料理完了後、同一セッションの食材管理ボード残量表示は古いまま（既知のボード間スナップショット問題の在庫ボード側・本チケットの回帰ではない。再読込で正常）
