---
ticket_id: TKT-0151
status: passed
execution_mode: automated_and_static
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - ai_server_route
  - pwa_mobile_ui
---

# TKT-0151 manual smokes

実行日時: 2026-06-02 07:00 JST

## target_evals

- `supabase_schema_change`: `ai_usage_events` テーブルと SECURITY DEFINER 関数（consume/refund/summary）の追加。
- `auth_and_rls_policy`: select本人のみのRLS、直接 insert/update/delete を閉じ、書き込みを関数経由に限定。
- `ai_server_route`: 2本のAI routeがGemini送信前に原子的予約し、超過時はGeminiへ送らない。失敗時は返金する。
- `pwa_mobile_ui`: レシピ生成・写真解析の近くに、スマホでも見える残り回数メーターがある。

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| verify一式 | pass | `harness/bin/verify_web.sh TKT-0151` で lint/typecheck/test/build/policy すべて pass |
| 上限境界（レシピ20/写真10/合計30） | pass | `ai-usage.test.ts` ほかで境界到達時の停止を確認 |
| 上限超過でGemini未送信 | pass | route テストで超過時に fetch が呼ばれないことを確認 |
| 返金（通信失敗・DL失敗で枠が戻る） | pass | route テストで `refund_ai_usage` 呼び出しと枠復元を確認 |
| 返金しない（Gemini ok後のparse失敗） | pass | 422時に refund を呼ばないことを確認 |
| 429の reason 分岐（機能別/合計） | pass | route テストで feature_limit / total_limit のメッセージ分岐を確認 |
| 別ユーザー分離 | pass | RLS select本人のみ＋関数が `auth.uid()` を強制。テストでユーザー分離を確認 |
| APIキー非露出 | pass | レスポンス・記録・エラーにキーが出ないことをテストで確認（`not.toContain`） |
| 残り回数UI（機能別0→該当ボタン無効 / 合計0→両方無効） | pass | `ai-usage-meter.test.tsx` / inventory-board / recipe-meal-workspace テストで確認 |
| ビルド成功（UI/ルート/型） | pass | `npm run build` 通過 |

実行コマンド:

```bash
harness/bin/verify_web.sh TKT-0151
```

## skipped_checks

- 本番/ローカル実Supabaseへの `supabase db push` 適用は未実施。理由はこのチケットではmigrationファイル追加までを対象とし、DB適用は公開前の運用判断とするため。
- 実DBを使った手動スモーク（実際に21回目/11回目/合計31回目を叩いて停止、Gemini失敗時の返金）は未実施。理由は実DB未適用・実Gemini課金回避のため。
- 実Gemini APIキーでのライブ生成・ライブ写真解析は未実施。理由は実キー送信と課金が発生し得るため。
- 実機スマホ/in-app Browserでの目視は未実施。自動テストとCSSで破綻は見つかっていない。

## open_risks

- 実DB未適用のため、`pg_advisory_xact_lock` を含む原子的予約の挙動は実環境での最終確認が必要。
- refundの5分制限は、Gemini応答が長時間化した場合に返金不可となる。実運用の最大応答時間と要整合。
- `ai_usage_events` の行数は増え続ける（1人最大30行/日）。将来の保全は別チケット。
