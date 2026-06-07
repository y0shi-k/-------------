---
id: TKT-0193-multi-image-ingredient-scan
title: 食材追加の複数画像AI解析対応
status: implementation_ready
goal: 食材追加の画像スキャンで複数画像を一度に選び、各画像をAI解析して、結果を1つの候補一覧で確認・登録できるようにする。
acceptance:
  - 食材追加の画像スキャンで複数画像を選択できる
  - 選択した画像がそれぞれ非公開Storageへ保存される
  - `POST /api/ai/scan-ingredients` が複数 `photoIds` を扱える
  - AI利用回数は画像枚数分として予約・消費される
  - 複数画像の候補が1つのAI候補一覧にまとまる
  - 一部画像が失敗しても成功候補は確認・登録でき、失敗件数が分かる
  - 全画像が失敗した場合は在庫候補を出さず、ユーザー向けエラーを出す
  - APIキー、写真URL、Storageパス、Service Role Key を直書きしない
  - Web版verify、manual smoke、reviewが通る
required_evals:
  - ai_server_route
  - photo_upload_storage
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/lib/ai/ingredient-scan.ts
  - web/src/__tests__/scan-ingredients-route.test.ts
  - web/src/__tests__/ingredient-scan.test.ts
  - project-os/artifacts/TKT-0193-multi-image-ingredient-scan/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0193-multi-image-ingredient-scan
related_artifacts:
  - artifacts/TKT-0193-multi-image-ingredient-scan/verify.json
  - artifacts/TKT-0193-multi-image-ingredient-scan/manual-smokes.md
  - artifacts/TKT-0193-multi-image-ingredient-scan/review.md
  - artifacts/TKT-0193-multi-image-ingredient-scan/report.md
owner_role: implementer
owner_notes:
  - 危険変更。AI API Route、写真Storage、Auth/RLS観点の確認が必要。
  - 既存APIの単体 `photoId` 利用を壊さない。可能なら `photoId` と `photoIds` の両方を受ける互換実装にする。
  - AI利用回数は画像枚数分。途中失敗時の返金ルールは既存 `consumeAiUsage` / `refundAiUsage` の考え方に合わせる。
  - フロントは一部成功を許容し、成功候補を一覧に出す。失敗件数は `photoFeedback` で伝える。
  - 写真は非公開Storage。署名付きURLやStorage pathを公開表示しない。
  - Gemini APIキーはDB保存しない。Google APIへはサーバーAPI Routeから送る。
  - verify は `/verify TKT-0193-multi-image-ingredient-scan`。manual smokeではスマホ写真選択・複数選択・Storage非公開を確認する。
---

# Summary

複数画像の食材AI解析に対応する。UI、Storage保存、API Route、AI利用回数にまたがるため、危険変更としてmanual smokeとreviewを必須にする。

## 実装メモ

- 対象:
  - `web/src/components/inventory-board.tsx`
  - `web/src/app/api/ai/scan-ingredients/route.ts`
  - `web/src/lib/ai/ingredient-scan.ts`
- APIの返却形は、成功候補の配列に加えて失敗件数やエラー概要を持てる形にする。
- テストでは2枚成功、1枚成功1枚失敗、全失敗、上限超過を扱う。

## 非対象

- AI候補の個別編集改善（TKT-0191）
- 0在庫履歴（TKT-0194）
