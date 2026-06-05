---
id: TKT-0150-user-owned-gemini-api-key
title: Gemini APIキーをユーザー持ちにする
status: ready
goal: 運営者のGemini APIキーと利用料に依存せず、ユーザー自身が用意したGemini APIキーでAI機能を使えるようにする
acceptance:
  - ユーザーがGemini APIキーを入力・削除できるUIがある
  - AIレシピ生成はユーザー入力のGemini APIキーで実行される
  - 食材写真解析はユーザー入力のGemini APIキーで実行される
  - Gemini APIキーはSupabase DBへ保存されない
  - Gemini APIキーはレスポンス、トースト、エラーメッセージ、console/logへ出ない
  - APIキー未入力時は、ユーザー自身のGemini APIキーが必要だと分かる案内が出る
  - Web版verifyが通る
required_evals:
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/app/api/ai/recipes/route.ts
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/ai/
  - web/src/__tests__/
  - project-os/artifacts/TKT-0150/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0150-user-owned-gemini-api-key
related_artifacts:
  - artifacts/TKT-0150/verify.json
  - artifacts/TKT-0150/manual-smokes.md
  - artifacts/TKT-0150/review.md
  - artifacts/TKT-0150/report.md
owner_role: implementer
owner_notes:
  - 危険変更（ai_server_route）。AI API routeの入力契約とキー取り扱いを変えるため manual-smokes.md / review.md を必須にする
  - ユーザーAPIキーはDBへ保存しない。MVPは localStorage または sessionStorage。実装前にどちらを既定にするか決める
  - APIキーをログ、エラー、レスポンスに含めない。テストでも実キー形式の値を使わない
  - 既存 `GEMINI_API_KEY` のfallbackを残すかどうかは、実装開始時に明示する。公開向けにはユーザーキー必須が望ましい
---

# Summary

Gemini APIを、運営者の環境変数ではなくユーザー自身が用意したAPIキーで使えるようにする。

## 実装メモ

- UI
  - AIレシピ生成と食材写真解析の近くに、Gemini APIキー設定UIを追加する。
  - 入力、保存、削除、保存済み状態の表示を用意する。
  - スマホでも入力しやすい配置にする。
- ブラウザ保存
  - MVPは `localStorage` または `sessionStorage` を使う。
  - 保存しないモードを作る場合は、セッション中だけReact stateに持つ。
- API route
  - `recipes/route.ts` と `scan-ingredients/route.ts` がユーザーAPIキーを受け取れるようにする。
  - 受け取ったキーはGemini API呼び出しの `x-goog-api-key` にだけ使う。
  - エラー時にもキー値を返さない。
- テスト
  - APIキー未入力時のエラー。
  - ユーザーキーがGemini fetchに渡ること。
  - JSONレスポンスにキーが含まれないこと。

## 手動確認

- APIキー未入力でAIレシピ生成を押すと、入力を促す。
- APIキー入力後、AIレシピ生成が動く。
- APIキー入力後、食材写真解析が動く。
- APIキー削除後、再度AI実行時に入力を促す。
- スマホ幅でキー入力UIが崩れない。

## 残リスク

- ブラウザ保存方式は、端末共有やXSSがあるとAPIキー流出リスクがある。UIかdocsで「保存しない/削除する」選択肢を分かりやすくする。
- ユーザーのGemini APIキーの作成・課金・制限はGoogle側の管理になるため、アプリ側では責任範囲を説明する必要がある。
