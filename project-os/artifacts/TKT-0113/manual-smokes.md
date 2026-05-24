---
ticket: TKT-0113-canvas-parity-audit
status: done
date: 2026-05-24
---

# Manual Smokes

## 結論

TKT-0113は機能実装ではなく監査チケットのため、ブラウザ実操作ではなく静的な画面・機能棚卸しを手動確認として実施した。

## 確認した範囲

- Canvas版 `app.html`
  - 在庫、登録待ち、保存場所、単位換算、買い物、レシピ、AI、献立、作りたい候補、今日ダッシュボード、調理ビューア、調理完了、料理記録、料理履歴、スマホ下部ナビ。
- Web版 `web/`
  - `web/src/app/page.tsx`
  - `web/src/components/inventory-board.tsx`
  - `web/src/components/recipe-meal-workspace.tsx`
  - `web/src/components/cooking-history-board.tsx`
  - `web/src/app/api/ai/scan-ingredients/route.ts`
- Supabase定義
  - `supabase/migrations/20260523094705_schema_v1.sql`
  - `supabase/migrations/20260523095800_fix_composite_fk_delete_actions.sql`

## 監査観点

- Canvas版にある主要体験がWeb版にあるか。
- GAS/Spreadsheet/DriveだけをSupabase/Next.jsへ置換できているか。
- Web版でAPIキーや写真を安全に扱っているか。
- CSV移行前にschemaへ影響しそうな未移植機能が残っていないか。

## 結果

- 写真AI食材解析、料理記録写真、本人データ制限はWeb版で安全な置換方針になっている。
- レシピ、献立、買い物、履歴は主要ワークフローのみ実装済みで、Canvas版の完全一致には不足がある。
- 単位換算、保存場所管理、作りたい候補、今日ダッシュボード、調理ビューア、調理完了時の在庫減算/代替品は未実装または大きく不足している。
- CSV移行は停止が妥当。

## 未実施の手動確認

- 実ブラウザでのスマホ表示確認。
- Supabase本番DBへの接続確認。
- Vercel公開環境での確認。

上記はTKT-0113の対象外。TKT-0114以降または公開前チェックで実施する。
