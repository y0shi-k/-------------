---
name: finalize
description: チケットの完了成果物（report.md、危険変更時はreview.md/manual-smokes.md）をproject-os/artifacts/<TKT>/に生成・記入し、/check-gatesで全gateが閉じることを確認する。変更が一段落したときに使う。
---

# /finalize — 完了成果物の作成

`project-os/artifacts/<TKT>/` に必要な artifact を揃え、phase gate を閉じる。

## 手順
1. TKT を取得し、`/check-gates <TKT>` を実行して、該当 eval と未閉 gate を把握する。
2. **verify がまだなら `/verify <TKT>` を先に実行**（`verify.json` を生成）。
3. 必須成果物を作る（既定は report.md のみ。`/check-gates` が危険evalを示した場合は review/manual-smokes も）:
   - `report.md` ← `.agents/templates/report.md`（必須セクション: 変更目的 / 今回追加した安全装置 / 実施した確認 / 残リスク / 次の依頼や人判断、front-matter `status: ready`）
   - `manual-smokes.md` ← `.agents/templates/manual-smokes.md`（危険変更時。front-matter `status: passed`、セクション executed_checks / skipped_checks / open_risks）
   - `review.md` ← `.agents/templates/review.md`（危険変更時。front-matter `status: passed`、セクション checked_diff_paths / checked_artifacts / findings / open_risks / verdict）
4. すべて**日本語**で記入する（識別子だけ英語可）。テンプレの example 値は残さない。
5. 再度 `/check-gates <TKT>` を実行し、**全 gate が ✅ になるまで**埋める。
6. **ナレッジ層を更新する**:
   - `project-os/knowledge/decisions.md` に今回の決定（決定/理由/却下案/次に確認）を追記（重要な判断があった場合）。
   - 踏んだ地雷・再発防止があれば `project-os/knowledge/learnings.md` に追記。
   - `project-os/backlog.md` の「現在のフォーカス」「次にやる候補」を更新（完了項目を外し、次を繰り上げ）。
7. ticket の `status` を `completed` に更新する。

## 注意
- 成果物は会話の要約ではなく、後から `project-os/` だけを読んで判定できる内容にする。
- 危険変更（Supabase schema / auth・RLS / 写真Storage / AI server route / CSV移行 / データ削除）以外は、
  軽量プロセス（verify.json + report.md）で完了してよい。
