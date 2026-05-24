---
id: SPEC-0113-canvas-parity-audit
title: Canvas版完全一致監査
status: spec_ready
scope:
  - app.html
  - web/
  - supabase/
  - project-os/knowledge/canvas-parity-matrix.md
constraints:
  - このspecでは機能実装をしない
  - CSV移行へ進む前に実施する
  - Canvas版 `app.html` の挙動を基準にする
  - スプシ/GAS/Drive連携だけはSupabase/Next.jsへ置換してよい
acceptance:
  - Canvas版の全主要画面、操作、AI機能、履歴、調理、買い物、在庫機能が棚卸しされている
  - Web版の実装済み/未実装/仕様差分が表で確認できる
  - `missing`, `changed`, `partial` の各項目に後続チケット方針がある
  - CSV移行を始めてよいか、または止めるべきかが判定されている
  - `project-os/knowledge/canvas-parity-matrix.md` が更新されている
related_tickets:
  - TKT-0113-canvas-parity-audit
---

# Summary

Web版を「スプシ連携以外はCanvas版と同じ」にするため、CSV移行前に完全一致監査を実施する。

## 背景

`TKT-0109` までのWeb版は主要ワークフロー実装であり、Canvas版の全機能を1対1で再現する仕様ではなかった。このままCSV移行へ進むと、未移植機能のためにschemaや画面を後から作り直す可能性がある。

## 仕様

- Canvas版 `app.html` を基準として、画面、ボタン、モーダル、AI機能、データ保存項目を棚卸しする。
- Web版 `web/` と `supabase/` を確認し、同等性を `same`, `supabase_replace`, `partial`, `missing`, `changed`, `not_audited` で分類する。
- `missing` と `changed` は必ず後続チケット候補にする。
- `partial` は追加実装が必要か、人判断で許容するかを明記する。
- CSV移行はこの監査完了後に再開する。

## 非対象

- Web機能の実装
- CSV移行
- Supabase本番DB操作
- Vercel公開
