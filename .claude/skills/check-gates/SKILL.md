---
name: check-gates
description: git diffから該当するchange_eval（required_evals）を自動判定し、未閉のphase gateと次アクションを表示する。完了報告の前や、どのartifactが必要か確認したいときに使う。
---

# /check-gates — phase gate 判定

`harness/bin/check_gates.py` を実行する。`harness/change_evals.json`（active のみ）と
`harness/phase_gates.json` を読み、現在の git diff から required_evals を自動判定し、
必要な artifact が揃っているかを検査する。

## 手順
1. 引数の TKT を取得（無ければスクリプトがブランチ名から推定）。
2. 次を実行する:
   ```bash
   python3 harness/bin/check_gates.py <TKT-xxxx>
   ```
3. 出力を読み、報告する:
   - 該当 active eval（🔴危険 / 🟢非危険）
   - 必須 gate の ✅/❌ 一覧
   - 未閉 gate と次アクション
4. 未閉 gate があれば、対応する Skill（`/verify` / `/finalize`）や ticket 修正で閉じる。
   **必須 gate が1つでも閉じていないうちは「完了」と報告しない。**

## 判定ロジックの要点
- 既定の必須成果物は `verify.json` + `report.md`。
- `danger: true` の eval（Supabase schema / auth・RLS / 写真Storage / AI server route / CSV移行）に
  該当する場合のみ `manual-smokes.md` / `review.md` も必須になる。
- reference eval（Canvas系）は判定対象外。
