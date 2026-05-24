# TKT-0121 Report

## Summary

Web版の献立画面を7日表示に更新し、前/次の7日移動、日付指定追加、前日/翌日移動、削除を追加した。

## Changed

- `web/src/components/recipe-meal-workspace.tsx`
  - 7日献立表示
  - 前/次の7日移動
  - 献立の前日/翌日移動
  - 献立削除
  - 日本時間でずれない日付計算
- `web/src/app/globals.css`
  - 7日献立とスマホ向け予定カードのスタイル
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 7日表示、移動、削除のテスト

## Verify

- `npm run test -- recipe-meal-workspace`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
