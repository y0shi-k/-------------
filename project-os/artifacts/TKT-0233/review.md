---
ticket_id: TKT-0233-production-auth-runbook
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0233-production-auth-runbook
---

# Review Record

## checked_diff_paths

- docs/runbook/認証本番化の適用手順.md（新規。適用順チェックリスト・E2EスモークA〜J・ロールバック・SMTP概要）
- docs/runbook/Supabaseの反映と運用ガイド.md（§12 に参照1行追記のみ。§10b 本文は不変）

## checked_artifacts

- project-os/artifacts/TKT-0233/verify.json（harness 正規実行・status=pass）
- project-os/artifacts/TKT-0233/manual-smokes.md（static_only・過剰マッチの静的記録）
- TKT-0228〜0232 の report/manual-smokes（skipped_checks の統合元として突合）

## subagent_usage

- 作成: impl-fast（Sonnet）。オーケストレーターが全文監査。
- **逸脱の検出と是正**: サブエージェントが verify.json と report.md を自作していた。
  verify.json は手書きの独自フォーマット（checks=skipped・status 欄なし）だったため、
  オーケストレーターが `harness/bin/verify_web.sh TKT-0233` を正規実行して上書き。
  report.md もテンプレ必須セクション欠落のため書き直した（learnings.md 2026-06-11 に再発防止を記録）。

## findings

1. **[是正済み・中]** 上記 verify.json 自作の件。gate はファイル存在ベースのため、放置すると
   「pass 風」の手書き artifact で gate が閉じてしまうところだった。
2. **[確認済み]** 適用順の要（migration→デプロイ）と「auth_profiles 未適用デプロイ＝全員 /pending 化」の
   警告が冒頭・①節の2箇所に明示されており、TKT-0230 report の運用リスクを正しく引き継いでいる。
3. **[確認済み]** 秘密実値なし（プレースホルダのみ）。service role key 不要＋ NEXT_PUBLIC_ 漏えい警告あり。
4. **[確認済み]** E2E スモーク A〜J が TKT-0228〜0232 の skipped_checks を統合・網羅。
5. **[確認済み]** 既存 runbook と重複記載なし（§5/§10b への参照方式）。参照先は全ファイル実在。
6. **[静的記録]** check-gates の危険 eval 表示は同居する未コミット auth 変更（TKT-0228〜0232）への
   過剰マッチ。本チケットは docs 2ファイルのみ（required_evals 正本=web_project_bootstrap）。

## open_risks

- 実際の本番適用・E2Eスモークはユーザー作業として残る（手順書がその台本）。

## verdict

passed — docs のみの変更で acceptance を満たす。サブエージェントの artifact 自作という
プロセス逸脱を検出・是正済み（learnings に記録）。手順書の内容は TKT-0228〜0232 の成果物と整合。
