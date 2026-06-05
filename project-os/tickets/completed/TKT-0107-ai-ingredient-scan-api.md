---
id: TKT-0107-ai-ingredient-scan-api
title: サーバー側AI食材解析API
status: ready_for_implementation
goal: 写真から食材候補を抽出し、登録待ちへ入れられるAI解析APIを作る
acceptance:
  - `POST /api/ai/scan-ingredients` 相当のAPIがある
  - Gemini APIキーはサーバー側環境変数から読む
  - ブラウザ側にAPIキーが出ない
  - AIレスポンスを検証し、食材候補配列へ整形する
  - 解析結果は登録待ち候補として表示され、ユーザー確認後に在庫化する
  - Web版verifyが通る
required_evals:
  - ai_server_route
  - photo_upload_storage
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/
  - project-os/artifacts/TKT-0107/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0107-ai-ingredient-scan-api
related_artifacts:
  - artifacts/TKT-0107/verify.json
  - artifacts/TKT-0107/manual-smokes.md
  - artifacts/TKT-0107/review.md
  - artifacts/TKT-0107/report.md
owner_role: implementer
owner_notes:
  - TKT-0106完了後に実施する
  - APIキー直書きは停止条件
  - 完了後は TKT-0108 に進む
---

# Summary

AI解析チケット。スマホ写真を食材登録候補へ変換する中核機能を作る。

## 実装メモ

- 解析対象はレシートまたは食材パッケージを想定する。
- 店舗名、住所、電話番号などは結果に含めないようプロンプトで指示する。
- JSON parse失敗時も画面が止まらないようにする。

## 次

TKT-0108-cooking-history-photo-web
