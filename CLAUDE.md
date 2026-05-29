# CLAUDE.md — Stock Master（料理レシピ・食材管理アプリ）

> Claude Code 用の入口。運用マニュアルの正本は `AGENTS.md` と `.agents/`、状態の正本は `project-os/`、
> 機械可読基準は `harness/*.json`。詳細はそれらを参照する。

@AGENTS.md

## このリポジトリでの最優先（グローバル設定を上書き）

- **Canvas版 `app.html` は凍結・参照専用。今後編集しない。** 過去実装の知見として読むだけ。
  Canvas固有のルール（GAS通信・スプシ手動一括同期・alert/confirm/prompt禁止等）は履歴参照用。
- **現役の正本は Web版**: `web/`（Next.js）+ `supabase/`（DB/Storage/Auth）。GAS/Spreadsheet/Drive は使わない。
- **main 運用**。feature branch を強制しない（グローバルの git ルールより優先）。
- **状態の正本は `project-os/`**（会話ログや外部メモリではない）。

## ワークフロー（Claude Code Skills）

- `/verify [TKT-xxxx]` … Web版の lint/typecheck/test/build + policy チェックを実行し `verify.json` を残す。
- `/check-gates [TKT-xxxx]` … git diff から required_evals を自動判定し、未閉の phase gate を表示。
- `/new-ticket` … `.agents/templates/ticket.md` から次番 TKT を雛形生成。
- `/finalize [TKT-xxxx]` … `report.md` を生成（危険変更時のみ `review.md` / `manual-smokes.md` も）。

## プロセス（軽量化済み）

- 既定の必須成果物は `verify.json` + `report.md` の2つ。
- `manual-smokes.md` / `review.md` は**危険変更時のみ必須**:
  Supabase schema / auth・RLS / 写真Storage / AI server route / CSV移行 / データ削除・移行。
- 同一画面・同一目的の軽量UI調整は、新規 ticket を乱発せず直近の関連 ticket に集約してよい。
- 詳細な gate 運用は `.agents/rules/verify-and-gates.md` を参照。
