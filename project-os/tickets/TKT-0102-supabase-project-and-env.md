---
id: TKT-0102-supabase-project-and-env
title: Supabase接続と環境変数管理
status: ready_for_implementation
goal: SupabaseをWeb版から安全に使うための接続設定と環境変数ルールを整える
acceptance:
  - `.env.example` にSupabase/Gemini/Vercelで必要な変数名がある
  - `NEXT_PUBLIC_` を付ける変数と付けない秘密変数が分かれている
  - service role keyをブラウザ側で参照しない
  - 非エンジニア向けのSupabase登録手順が `docs/runbook/` にある
  - `rg` でAPIキー実値やDBパスワードの直書きがない
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - docs/runbook/
  - project-os/artifacts/TKT-0102/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0102-supabase-project-and-env
related_artifacts:
  - artifacts/TKT-0102/verify.json
  - artifacts/TKT-0102/manual-smokes.md
  - artifacts/TKT-0102/review.md
  - artifacts/TKT-0102/report.md
owner_role: implementer
owner_notes:
  - TKT-0101完了後に実施する
  - Supabase本番プロジェクト作成やVercel設定変更は明示依頼がある場合だけ行う
  - 完了後は TKT-0103 に進む
---

# Summary

Supabaseの入口を作るチケット。まだテーブルは作らず、環境変数とclientの安全な使い方を固定する。

## 実装メモ

- browser clientはanon keyのみ使用する。
- service role keyが必要な処理はserver側だけに閉じる。
- `.env.example` に実値は入れない。

## 次

TKT-0103-supabase-schema-v1
