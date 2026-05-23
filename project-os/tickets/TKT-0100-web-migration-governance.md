---
id: TKT-0100-web-migration-governance
title: Web移植に向けたAGENTS/ハーネス運用整備
status: ready_for_implementation
goal: Canvas版を壊さずにWeb版移植を始められるよう、正本・verify・安全ルール・evalを分離する
acceptance:
  - `AGENTS.md` にCanvas版とWeb版の正本、verify、禁止事項が明記されている
  - `.agents/` のルールとテンプレートがWeb版移植に対応している
  - `harness/registry.json` にWeb版のmanual smoke項目が追加されている
  - `harness/change_evals.json` にWeb版用evalが追加されている
  - `project-os/knowledge/web-migration-map.md` にチケット分解と対応表が残っている
  - Webアプリ本体、Supabase schema、既存 `app.html` は変更しない
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
  - photo_upload_storage
eval_selection_mode: manual
changed_paths:
  - AGENTS.md
  - .agents/index.md
  - .agents/rules/source-of-truth.md
  - .agents/rules/tech-stack.md
  - .agents/rules/data-safety.md
  - .agents/rules/verify-and-gates.md
  - .agents/templates/spec.md
  - .agents/templates/ticket.md
  - harness/registry.json
  - harness/change_evals.json
  - project-os/knowledge/web-migration-map.md
  - project-os/specs/SPEC-0100-web-migration-governance.md
  - project-os/tickets/TKT-0100-web-migration-governance.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - review_ready
  - report_ready
related_specs:
  - SPEC-0100-web-migration-governance
related_artifacts:
  - artifacts/TKT-0100/verify.json
  - artifacts/TKT-0100/review.md
  - artifacts/TKT-0100/report.md
owner_role: implementer
owner_notes:
  - このticketではWebアプリ本体を作らない
  - `app.html` は変更しない
  - JSON編集後は `python3 -m json.tool harness/registry.json` と `python3 -m json.tool harness/change_evals.json` を実行する
  - Canvas版とWeb版のルールが混ざらないことを確認する
---

# Summary

Web版移植の最初のticket。Next.jsやSupabaseの実装ではなく、AIと人が同じ判断基準で進められるようにプロジェクト管理ルールを更新する。

## 実装メモ

- `AGENTS.md` はこのリポジトリの入口として、Canvas版とWeb版の違いを短く示す。
- `.agents/rules/source-of-truth.md` では正本と生成物を分ける。
- `.agents/rules/tech-stack.md` ではWeb版のNext.js + Supabase + Vercel構成と、GAS禁止を明記する。
- `.agents/rules/data-safety.md` ではSupabase秘密鍵、写真、RLS、Storage非公開を追加する。
- `.agents/rules/verify-and-gates.md` ではCanvas verifyとWeb verifyを分ける。
- `harness/*.json` にはWeb版evalとmanual smokeを追加する。
- `project-os/knowledge/web-migration-map.md` に `TKT-0101` 以降の分解を残す。

## 残リスク

- `web/` がまだ存在しない段階ではWeb verifyは実行できないため、このticketではJSON構文確認とルール整合確認を中心にする。
- Supabase実プロジェクト、Vercel公開、CSV移行は後続ticketで扱う。
