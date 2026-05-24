# TKT-0123 Report

## Summary

Web版の最上部に今日ダッシュボードを追加し、今日の献立、期限が近い在庫、未購入の買い物、作りたい候補をまとめて確認できるようにした。

## Changed

- `web/src/components/today-dashboard.tsx`
  - read-only dashboard component
- `web/src/app/page.tsx`
  - dashboardをWebModeShellの上に表示
- `web/src/app/globals.css`
  - dashboard cards and mobile-first layout
- `web/src/__tests__/today-dashboard.test.tsx`
  - dashboard summary test

## Verify

- `npm run test -- today-dashboard`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
