---
id: TKT-0101-web-project-bootstrap
title: Web版Next.js土台作成
status: ready_for_implementation
goal: `web/` にWeb版開発の最小土台を作り、以後のチケットを実装できる状態にする
acceptance:
  - `web/` にNext.js + TypeScript構成が作成されている
  - npm scripts に `lint`, `typecheck`, `test`, `build` がある
  - `.env.example` に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` などの名前だけがある
  - 初期ページがスマホ/タブレット/PC幅で表示できる
  - `cd web && npm run lint && npm run typecheck && npm run test && npm run build` が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - .gitignore
  - web/
  - project-os/artifacts/TKT-0101/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0101-web-project-bootstrap
related_artifacts:
  - artifacts/TKT-0101/verify.json
  - artifacts/TKT-0101/manual-smokes.md
  - artifacts/TKT-0101/review.md
  - artifacts/TKT-0101/report.md
owner_role: implementer
owner_notes:
  - まずこのチケットから開始する
  - `app.html` は触らない
  - Supabase実接続は次の TKT-0102 で扱う
  - 完了後は TKT-0102 に進む
---

# Summary

Web版の土台作成チケット。最初のゴールは「空のNext.jsアプリが安全に起動・検証できること」。

## 実装メモ

- 推奨構成: Next.js App Router + TypeScript + ESLint + Tailwind。
- テストは最小でよいが、`npm run test` が存在して失敗しない状態にする。
- `.env.local` は作ってもよいがコミット対象にしない。共有するのは `.env.example` のみ。

## 次

TKT-0102-supabase-project-and-env
