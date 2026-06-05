---
id: TKT-0174-recipe-image-upload-ui
title: レシピ画像の登録・差し替え・削除UI
status: completed
goal: レシピ編集画面からユーザーが画像を登録でき、一覧・詳細・提案で写真カードとして使えるようにする
acceptance:
  - レシピ編集画面で画像選択、プレビュー、保存ができる
  - レシピ画像を差し替えできる
  - レシピ画像を削除でき、削除後は固定デモ画像またはプレースホルダに戻る
  - レシピ一覧カード、レシピ詳細、作りたい候補/提案でユーザー登録画像が優先表示される
  - 画像なしレシピは既存の1文字プレースホルダで崩れない
  - スマホ幅で画像UIのボタンや文字が重ならない
  - Web版verifyが通る
required_evals:
  - photo_upload_storage
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/ui/recipe-image.ts
  - web/src/lib/
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0174-recipe-image-upload-ui/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0174-recipe-image-upload-ui
related_artifacts:
  - artifacts/TKT-0174-recipe-image-upload-ui/verify.json
  - artifacts/TKT-0174-recipe-image-upload-ui/manual-smokes.md
  - artifacts/TKT-0174-recipe-image-upload-ui/review.md
  - artifacts/TKT-0174-recipe-image-upload-ui/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0173完了が前提**。DB列・Storage policyが無い状態では実装に入らない。
  - 表示優先順位は「ユーザー登録画像 → TKT-0172固定デモ画像 → プレースホルダ」。
  - アップロードは非公開Storageへ保存し、表示は署名付きURLを使う。公開URL保存は禁止。
  - 画像は圧縮・リサイズして保存する。元画像を巨大なまま保存しない。
  - 差し替え・削除時は古いStorage objectの扱いを実装し、失敗時の影響をreportに残す。
  - Canvas版 `app.html` は触らない。APIキー・秘密情報を直書きしない。
---

# Summary

レシピ編集UIに画像登録機能を追加し、カード・詳細・提案でユーザー登録画像を優先表示する。

## 実装メモ

- レシピフォーム内に画像プレビュー枠と操作ボタンを追加する。
- 保存フローにStorage uploadとDB path更新を組み込む。
- 削除フローではStorage object削除とDB path `null` 更新を行う。
- `RecipeThumb` / `resolveRecipeImage` 周辺を、DB画像優先に拡張する。
- テストは画像あり/なし、削除、フォールバックを中心に追加する。

## 検証メモ

- `/verify TKT-0174-recipe-image-upload-ui`
- スマホ幅でレシピ編集モーダル/画面の画像UIを確認する。
- 未ログインや他人データを扱えないことを確認する。

## 残リスク

- 写真アップロードは個人情報リスクがあるため、Storage非公開と署名付きURLの確認を必須にする。
