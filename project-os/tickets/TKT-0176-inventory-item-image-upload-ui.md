---
id: TKT-0176-inventory-item-image-upload-ui
title: 食材画像の登録・差し替え・削除UI（同名食材の記憶つき）
status: implementation_ready
goal: 標準画像で足りない食材をユーザーが変更でき、次回から同じ食材名ではユーザー画像を優先表示できるようにする
acceptance:
  - 在庫編集画面で画像選択、プレビュー、保存ができる
  - 食材画像を差し替えできる
  - 食材画像を削除でき、削除後は標準画像または絵文字へ戻る
  - 自動では標準画像/絵文字が表示され、ユーザーが変更した場合はユーザー画像が優先される
  - ユーザーが「同じ食材名にも使う」設定で保存した画像は、同じユーザーの同名食材で次回から優先表示される
  - 食材名の表記ゆれはTKT-0175のresolverと同じ正規化方針で吸収される
  - 在庫一覧で、個別在庫画像 → ユーザー食材名画像 → 標準画像 → 絵文字の順で表示される
  - 買い物リストや候補表示は、明示的に記憶済みのユーザー食材名画像がある場合だけ使い、無ければ標準画像/絵文字で崩れない
  - スマホ幅で画像UIのボタンや文字が重ならない
  - Web版verifyが通る
required_evals:
  - photo_upload_storage
  - auth_and_rls_policy
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/
  - web/src/components/inventory-board.tsx
  - web/src/lib/ui/ingredient-image.ts
  - web/src/lib/photos/
  - web/src/lib/
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0176-inventory-item-image-upload-ui/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0176-inventory-item-image-upload-ui
related_artifacts:
  - artifacts/TKT-0176-inventory-item-image-upload-ui/verify.json
  - artifacts/TKT-0176-inventory-item-image-upload-ui/manual-smokes.md
  - artifacts/TKT-0176-inventory-item-image-upload-ui/review.md
  - artifacts/TKT-0176-inventory-item-image-upload-ui/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0173完了が前提**。TKT-0175完了後に実装すると標準画像フォールバックまで確認しやすい。
  - 表示優先順位は「在庫アイテム個別画像 → ユーザー食材名画像 → TKT-0175標準画像 → 絵文字」。
  - アップロードは非公開Storageへ保存し、表示は署名付きURLを使う。公開URL保存は禁止。
  - `inventory_items.image_storage_path` は在庫1件だけの上書き用として使う。
  - 同名食材で次回も使う画像は `user_ingredient_images`（ユーザー別・正規化食材名別）で記憶する。
  - 買い物リスト等では、同じユーザーが明示保存した `user_ingredient_images` だけを参照し、他人画像や推測画像は使わない。
  - `user_ingredient_images.image_storage_path` も非公開 `photos` バケットのStorage pathのみ保存する。公開URLは保存しない。
  - このアップグレードはDB migrationを含むため、実装後にSupabaseへ反映する場合はSupabase Pushが必要。
  - Canvas版 `app.html` は触らない。APIキー・秘密情報を直書きしない。
---

# Summary

食材/在庫編集UIに画像登録機能を追加し、標準画像で足りない食材をユーザーが補えるようにする。
さらに、ユーザーが登録した画像を「同じ食材名の標準」として記憶し、次回以降の同名食材にも自動適用できるようにする。

## 実装メモ

- 在庫編集モーダルに画像プレビュー枠と操作ボタンを追加する。
- 保存フローにStorage uploadとDB path更新を組み込む。
- 削除フローではStorage object削除とDB path `null` 更新を行う。
- `user_ingredient_images` テーブルを追加し、`user_id + normalized_name` で一意にする。
- 画像保存UIには「同じ食材名にも使う」を用意し、既定ONにする。
- 「同じ食材名にも使う」がONの場合、保存時に `user_ingredient_images` をupsertする。
- 食材名変更時は、現在の食材名で正規化キーを作り直して表示候補を引く。
- `ingredient-image` resolverを、ユーザー画像優先に拡張する。
- テストは個別画像、ユーザー食材名画像、標準画像フォールバック、絵文字フォールバック、削除を確認する。

## 検証メモ

- `/verify TKT-0176-inventory-item-image-upload-ui`
- Supabase migrationのRLS/所有者制約を確認する。
- スマホ幅で在庫編集モーダルの画像UIを確認する。
- Storage非公開・本人限定をmanual-smokes/reviewに記録する。

## 残リスク

- 写真アップロードは個人情報リスクがあるため、Storage非公開と署名付きURLの確認を必須にする。
- 同じ食材名の記憶は便利だが、名前の揺れや別商品への誤適用がありうるため、正規化ルールと削除UIを分かりやすくする。
