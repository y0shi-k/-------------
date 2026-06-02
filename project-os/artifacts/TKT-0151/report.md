---
ticket_id: TKT-0151
status: ready
---

# TKT-0151 report

## 変更目的

乗っ取り・誤操作・連打が起きても、Gemini AI機能をサーバー側で1日上限まで原子的に制限し、ユーザー自身のGemini課金が暴走しないようにする。TKT-0150でAPIキーがユーザー持ちになったため、上限の主目的は「運営者費用の抑制」ではなく「本人課金の暴走防止の安全ネット」と位置づける。

## 今回追加した安全装置

- Supabaseに利用記録テーブル `ai_usage_events`（user_id / feature / usage_date(JST) / created_at）を追加。
- RLSは **select 本人のみ**。insert/update/delete の直接ポリシーは作らず、書き込みは SECURITY DEFINER 関数経由に限定。`authenticated` ロールにのみ execute を付与（public/anon は revoke）。
- 上限判定は **原子的予約方式**:
  - `consume_ai_usage(feature)` … `pg_advisory_xact_lock(uid)` で同一ユーザーの並行実行を直列化し、JST当日の機能別・合計件数を確認して上限内なら1行insert。超過時は `feature_limit` / `total_limit` を返す。
  - 上限値（recipe 20 / scan 10 / total 30）は **SQL関数内に単一定義**。UI・libにハードコードしない。
- **失敗時返金**:
  - `refund_ai_usage(event_id)` … 本人の直近予約（5分以内）のみ削除。過去履歴の削除による上限リセットは不可。
  - Gemini通信失敗（`!ok`）・写真ダウンロード失敗時に返金し、当日枠を消費しない。
  - Gemini ok応答後のparse失敗（422）は、Google quotaを実消費しているため消費維持。
- AI route 統合:
  - `recipes/route.ts` … 認証後・Gemini送信前に予約。超過は429。
  - `scan-ingredients/route.ts` … 写真所有確認（404）後・**ダウンロード前**に予約。超過は429（Storage I/Oを行わない）。ダウンロード失敗は返金。
  - 429メッセージは機能別/合計で出し分け（原因・影響・修正方法の形式）。
- UI: `ai-usage-meter.tsx` を追加し、機能別＋合計の残り回数を表示。機能別0で該当ボタン無効、合計0で両方無効。AI実行（成功・429）後に再取得。

## 実施した確認

`harness/bin/verify_web.sh TKT-0151`

- lint: pass
- typecheck: pass
- test: pass（vitest 84件）
- build: pass
- no_gas_dependency: pass
- no_hardcoded_secret: pass
- supabase_rls_present: pass

追加確認（自動テスト）:

- 上限境界（recipe 20 / scan 10 / 合計30）で停止すること。
- 上限超過時にGeminiへfetchしないこと。
- 返金（通信失敗・ダウンロード失敗で枠が戻る／ok時は戻らない）。
- 429の `reason` が機能別/合計で分岐すること。
- 別ユーザーの回数と分離されること。
- APIキーがレスポンス・記録・エラーに含まれないこと。
- UIで機能別0→該当ボタン無効、合計0→両方無効。

## 残リスク

- **本番DBへの適用は未実施**。migrationファイル追加のみ。`supabase db push` 等の適用と、実DBでの手動スモーク（21回目/11回目/合計31回目で停止、Gemini失敗時の返金、別ユーザー分離、スマホ表示）は公開前に必要。
- 返金は「Gemini通信失敗（未処理）」のみ対象。ok応答後のparse失敗は消費扱いのまま。
- refundの5分時間制限は、長時間のGemini応答を考慮した値。実際の最大応答時間と整合するか実運用で確認する。
- `ai_usage_events` は1人あたり最大30行/日で増え続ける。当面問題ないが、古い行の定期削除は別チケットで検討する。
- 実Gemini APIキーでのライブ確認は未実施（実キー送信・課金を避けるため）。

## 次の依頼や人判断

- 公開前に `supabase db push`（または本番マイグレーション）でテーブル・関数・RLSを適用する。
- 適用後、実DBで上限到達・返金・別ユーザー分離・スマホ表示を手動確認する。
- 古い `ai_usage_events` の保全（定期削除）が必要になったら別チケット化する。
