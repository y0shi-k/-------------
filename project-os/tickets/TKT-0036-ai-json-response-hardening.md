---
id: TKT-0036-ai-json-response-hardening
title: AI JSONレスポンス解析の堅牢化
status: implementation_ready
goal: Gemini応答にJSON外テキストが混ざった場合のAI機能失敗を防ぐ
acceptance:
  - JSON本体の後ろに説明文が付いてもレシピ構造化が失敗しない
  - レシピ考案・期限予測・画像スキャンも同じJSON抽出処理を使う
  - 既存verifyが通る
required_evals:
  - ai_json_parse_regression
  - static_verify
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0036-ai-json-response-hardening.md
  - project-os/tickets/TKT-0036-ai-json-response-hardening.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0036-ai-json-response-hardening
related_artifacts:
  - artifacts/TKT-0036/verify.json
  - artifacts/TKT-0036/manual-smokes.md
  - artifacts/TKT-0036/review.md
  - artifacts/TKT-0036/report.md
owner_role: implementer
owner_notes:
  - Spreadsheet書き込みは変更しないため、manual_bulk_sync_policy は対象外
---

# Summary

テキストからレシピ追加のAI構造化で、Gemini応答のJSON後ろに余分な文字が含まれ `JSON.parse()` が失敗した。AI JSONレスポンス処理を共通化し、同種の揺れを全AI JSON機能で吸収する。

## 実装メモ

- `responseMimeType: application/json` は維持する。
- JSON全体のparseに失敗した場合のみ、コードフェンスまたは最初の完全なJSONブロック抽出へフォールバックする。
