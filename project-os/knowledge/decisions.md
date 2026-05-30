# Decisions（決定ログ）

> 重要な決定・理由・却下案を残し、同じ議論のやり直しを防ぐための正本。
> `/finalize` 実行時に当該チケットの決定を追記する。新しい決定を上に積む。

---

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
