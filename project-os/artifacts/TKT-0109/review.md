---
ticket_id: TKT-0109-recipes-and-meal-schedule-web
status: reviewed
checked_diff_paths:
  - web/
  - supabase/
  - project-os/artifacts/TKT-0109/
---

# TKT-0109 レビュー

## 結果

重大な問題は見つからなかった。

## 確認したこと

- `web/src/app/page.tsx` はログイン済みユーザーの `user.id` で各テーブルを絞っている。
- 新規UIは `web/src/components/recipe-meal-workspace.tsx` に閉じており、既存の在庫・料理履歴コンポーネントを直接変更していない。
- レシピ保存時に `recipes` と `recipe_ingredients` へ `user_id` を含めている。
- 献立保存、買い物追加、調理完了履歴にも `user_id` を含めている。
- Web版にGAS、Spreadsheet、Drive依存は追加されていない。
- APIキー、Supabase秘密鍵、写真URLの実値は追加されていない。
- schema変更は不要だったため、`supabase/` のmigrationは追加していない。

## テスト

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed

## 注意点

- 調理完了後は `router.refresh()` でサーバーデータを読み直す。通信状況によって反映に少し時間がかかる可能性がある。
- 不足食材の数量比較は、仕様どおり単位が同じ在庫だけを対象にしている。
