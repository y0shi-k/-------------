# Decisions（決定ログ）

> 重要な決定・理由・却下案を残し、同じ議論のやり直しを防ぐための正本。
> `/finalize` 実行時に当該チケットの決定を追記する。新しい決定を上に積む。

---

## 2026-06-02

### 決定（TKT-0151: Gemini AI利用の1日回数制限）
Gemini AI機能に日次上限（recipe 20 / scan 10 / 合計 30、JST暦日）をサーバー側で設ける。
判定は **原子的予約方式**: Gemini送信前に `consume_ai_usage()`（`pg_advisory_xact_lock` + 条件付きinsert）で
1回分を予約し、上限超過時はGeminiへ送らず429。Gemini通信失敗・写真DL失敗時は `refund_ai_usage()` で返金し
当日枠を消費しない。ok応答後のparse失敗は消費維持。`ai_usage_events` はRLS select本人のみ、
insert/update/delete は閉じ、書き込みは SECURITY DEFINER 関数経由（authenticatedのみ grant）。
refundは本人の直近5分の予約のみ削除可（履歴削除によるリセット不可）。上限値はSQL関数に単一定義。

### 理由
TKT-0150でAPIキーがユーザー持ちになり、上限の主目的は「運営者費用の抑制」→「乗っ取り・連打時の
本人課金の暴走防止の安全ネット」に変質した。連打耐性（原子的予約）と「一時的Geminiエラーで枠を
消費しない」（返金）を両立させるため、予約＋失敗時返金を採用。

### 却下した案
- 「成功時のみ記録（予約なし）」 → 大量同時リクエスト（乗っ取りバースト）に弱く、上限を一時的に超えうる。
- 「予約・失敗もカウント」 → 実装は最小だが、一時的502で自費キーの枠を消費しUX悪化。
- 上限値をlib/UIにも定義 → ドリフトの元。SQL単一ソースに統一。
- 日付境界UTC → DB実装は単純だがユーザー体験はJSTが自然。JSTを採用。

### 次に確認すること
- 公開前に `supabase db push` で適用し、実DBで上限到達・返金・別ユーザー分離・スマホ表示を手動確認。
- refundの5分制限が実Gemini最大応答時間と整合するか。
- `ai_usage_events` の行数増加に対する保全（定期削除）を別チケット化するか。

## 2026-05-31

### 決定
ハーネスにナレッジ層（decisions / learnings / glossary）とマクロ層（backlog）を追加し、
Canvas凍結に伴い Canvas系 eval を `harness/legacy/` へ分離。凍結ファイルへの編集を Hook でブロックする。

### 理由
設計ノート（`docs/reports/ハーネス設計について_まさおNote.md`）と突き合わせ、ミクロ層は強いが
マクロ層・ナレッジ層・自動ガードレールが弱いと判明したため。

### 却下した案
- 本質ドキュメント（essence-development.md 等）の新設 → coding-standards.md と各evalの review_focus が代替済み。
- Canvas eval の完全削除 → 過去知見として `harness/legacy/canvas_evals.json` に退避（消さない）。

### 次に確認すること
- backlog.md の「現在のフォーカス」が実際の優先順位と合っているか（ユーザー確認）。

---

## 2026-05-29

### 決定
Codex前提のハーネスを Claude Code / Opus 4.8 に移行。グローバルの SuperClaude を廃止し、
Canvas版 `app.html` は凍結・参照専用、Web版（`web/` + `supabase/`）を現役の正本とする。
散文だったゲート/verifyを実行スクリプト（`harness/bin/verify_web.sh` / `check_gates.py`）+ Skills 化。

### 理由
ゲート/eval が定義だけで実行されず、verify が肝心の不変条件を検査していなかった。
Claude Code のネイティブ機能で「動く」形にするため。

### 却下した案
- AGENTS.md を破棄して CLAUDE.md に一本化 → Codex併用の保険として AGENTS.md を正本マニュアルに残し、CLAUDE.md は薄い入口に。
- 6成果物フルプロセス維持 → ソロ規模に対し重いため verify+report を既定に軽量化。

### 次に確認すること
- 実チケットで `/implement`（危険度ルーティング）の委譲挙動を確認する。
