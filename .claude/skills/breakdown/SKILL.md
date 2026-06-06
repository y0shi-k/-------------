---
name: breakdown
description: 承認済みのチケット分割案（/plan-initiative の成果）を、別セッションやCodexが迷わず実装できる粒度の詳細TKTへ連番展開する。plan承認後の実行モードで使う。
---

# /breakdown — 分割案を詳細チケットへ展開

`/plan-initiative` で**承認済みのラフ分割案**を読み、各チケットを **`/new-ticket` 相当の詳細粒度**で
連番生成する。狙いは「別セッションやCodexにこのファイルを渡せば、迷わず実装に入れる」こと。

> 前提: 同一セッションで `/plan-initiative` の分割案が承認済み（会話コンテキストに残っている）こと。
> 承認された分割案が見当たらない場合は、先に `/plan-initiative`（plan mode）を案内する。

## 手順

1. **承認済み分割案を確認**する。仮IDごとの title / goal / 依存順 / 危険度 / 想定 changed_paths を把握する。
   分割案が会話に無ければ、ユーザーに分割案を提示してもらうか `/plan-initiative` をやり直す。
2. **採番**（completed も含めて再帰走査。番号再利用を防ぐ）:
   ```bash
   find project-os/tickets -name 'TKT-*.md' | grep -oE 'TKT-[0-9]+' | sort -V | tail -1
   ```
   末尾+1 から、分割案の**依存順**に沿って 4桁ゼロ埋めで連番採番する（土台チケットを先に）。
3. **各チケットを `.agents/templates/ticket.md` から生成**し、`project-os/tickets/TKT-xxxx-<slug>.md`
   に書く。`<slug>` は英小文字ハイフン。テンプレの example 値（TKT-0000 等）は必ず実値へ置換する。
4. **「迷わない粒度」を各チケットで担保**する（以下を必ず埋める。空欄・例値を残さない）:
   - `title` / `goal`
   - `acceptance`: **検証可能な**完了条件（曖昧語を避け、満たせたか判定できる粒度）
   - `changed_paths`: 触る予定の具体パス（`web/...` / `supabase/...`）
   - `required_evals`: `harness/change_evals.json` の active eval から変更範囲に合うものを選ぶ。
     迷ったら確定前に該当チケットで一度 `/check-gates` を回して match を見てよい。
   - `required_gates`: required_evals の `phase_gate_tags` に合わせる
     （非危険なら `verify_passed` + `report_ready` 中心、危険なら `manual_smokes_done` / `review_ready` を追加）
   - `related_specs`: 関連 spec。無ければ `.agents/templates/spec.md` から spec も作る
   - **実装メモ**: 実装者（別セッション/Codex）が前提なしで動けるよう、参照すべき既存ファイル・既存パターン・
     注意点（GAS/Spreadsheet/Drive 不使用、APIキー直書き禁止、RLS/Storage 権限確認 等）を具体的に書く
   - **非ゴール**: このチケットでやらないこと（スコープ境界）
   - **依存チケット**: 先行 TKT 番号（分割案の依存順を実 TKT 番号で明記）
5. **危険チケットの追加成果物**を required_gates に反映する。`danger: true` の eval
   （schema / auth・RLS / 写真Storage / AI route / CSV移行）に該当するチケットは
   `manual_smokes_done` / `review_ready` を required_gates に足す。
6. 生成した TKT 一覧（番号・title・依存順・危険度）をユーザーに報告する。
   必要なら `project-os/backlog.md` の「次にやる候補」に依存順で1行ずつ追記する。

## 品質チェック（生成後に各チケットで確認）

- [ ] example 値（TKT-0000 / SPEC-0000 / example_eval）が残っていない
- [ ] `acceptance` が検証可能（「ちゃんと動く」のような曖昧語でない）
- [ ] `changed_paths` が具体パスで、`required_evals` と整合している
- [ ] 危険チケットは独立しており、required_gates に manual_smokes/review が入っている
- [ ] 実装メモに「参照すべき既存ファイル/パターン」が書かれ、前提なしで着手できる
- [ ] 依存順が実 TKT 番号で明記されている

## 注意

- Canvas版 `app.html` は凍結。対象は Web版（`web/` + `supabase/`）のみ。
- 現役チケットはトップ階層（`project-os/tickets/`）に置く。`tickets/completed/` への移動は `/finalize` のみ。
- 採番は非再帰 `ls` を使わない（completed/ を取りこぼし番号を再利用するため）。
- 実装は各チケットごとに `/implement <TKT>` で行う（このスキルは詳細チケット生成までが責務）。
