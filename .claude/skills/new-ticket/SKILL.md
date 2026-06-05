---
name: new-ticket
description: project-os/templates/ticket.md から次番のTKT-xxxxチケットを雛形生成する。非trivialなWeb版変更を始める前に使う。
---

# /new-ticket — 新規チケット作成

`.agents/templates/ticket.md` を元に、次の連番で `project-os/tickets/TKT-xxxx-<slug>.md` を作る。

## 手順
1. 次番を決める（**完了済みは `tickets/completed/` に移動しているため再帰で走査する**）:
   ```bash
   find project-os/tickets -name 'TKT-*.md' | grep -oE 'TKT-[0-9]+' | sort -V | tail -1
   ```
   末尾+1 を 4桁ゼロ埋めで採番（例: 最新 TKT-0142 → `TKT-0143`）。
   非再帰の `ls` だと completed/ の番号を取りこぼし、番号を再利用してしまうので使わない。
2. ユーザーから目的を聞き、英小文字ハイフンの `<slug>` を決める。
3. `.agents/templates/ticket.md` を読み、front-matter を埋めて新規ファイルに書く:
   - `id`: `TKT-0143-<slug>`
   - `title` / `goal` / `acceptance`
   - `owner_role`: 既定 `implementer`
   - `required_evals`: `harness/change_evals.json` の active eval（Web版）から、変更範囲に合うものを選ぶ。
     迷ったら `/check-gates` を一度回して match を見てから確定してよい。
   - `changed_paths`: 触る予定の `web/` / `supabase/` パス
   - `related_specs`: 関連 spec（無ければ `.agents/templates/spec.md` から spec も作る）
   - `required_gates`: required_evals の `phase_gate_tags` に合わせる（非危険なら `verify_passed` + `report_ready` 中心）
4. テンプレの example 値（TKT-0000 等）を必ず実値へ置き換える。残すと `/check-gates` が spec_ready/implementation_ready を開いたままにする。

## 注意
- Canvas版 `app.html` は凍結。チケットの対象は Web版（`web/` + `supabase/`）のみ。
- 同一画面・同一目的の軽量UI調整は新規チケットを乱発せず、直近の関連チケットに集約する。
- **現役チケットはトップ階層（`project-os/tickets/`）に、完了チケットは `tickets/completed/` に置く**（`/finalize` が自動で移動）。新規作成は必ずトップ階層に置く。
