# TKT-0124 Report

## Summary

Web版に調理ビューアを追加し、レシピ詳細から材料、調味料、在庫有無、下準備、調理手順、手順内材料チップを確認できるようにした。

## Changed

- `web/src/components/recipe-meal-workspace.tsx`
  - 調理ビューを開くボタン
  - `CookingViewer`
  - 材料/調味料タブ
  - 下準備/調理手順タブ
  - 在庫有無表示
  - 手順内材料チップ
- `web/src/app/globals.css`
  - 調理ビューアのスマホ向けカード表示
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 調理ビューアの表示・タブ・在庫・材料チップテスト

## Verify

- `npm run test -- recipe-meal-workspace`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
