---
id: SPEC-0162-web-desktop-home-dashboard
title: ホーム/ダッシュボード画面（「ようこそ」広画面ランディング）
status: draft
scope:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/today-dashboard.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 既存データの集約表示のみ。新しいDBクエリ・データソースを増やさない
  - 非危険変更（schema/auth/RLS/Storage/AI route は変更しない）
  - TKT-0157（デスクトップシェル）完了が前提
  - 【IA確定（2026-06-03・案A）】ホーム新設＋PCのみ初期表示。スマホは食材管理起点据え置き・下部タブ3つ・ホーム非初期表示。decisions.md に記録済み
  - APIキー・写真URL・Service Role Keyをブラウザへ出さない
acceptance:
  - PCサイドバーの主ナビに「ホーム」項目が追加され表示できる
  - PCの初期表示はホームになる（≥1024px）。スマホは従来どおり食材管理起点
  - ホームに挨拶＋サマリーカード（既存カウント）が表示される
  - ホームに今日の献立／レシピ候補／在庫アラート等、既存データ集約のカードが並ぶ
  - 各カードから該当モードへ遷移できる
  - Web版verifyが通る
related_tickets:
  - TKT-0162-web-desktop-home-dashboard
---

# Summary

添付モック「ようこそ」に沿った広画面ホーム/ダッシュボードを追加する。既存データ（カウント・今日の献立・レシピ候補・在庫アラート）の集約でPC入口の一覧性を高める。新規データソースは増やさない。

## 背景

- `web-mode-shell.tsx` は既に4種のカウントを受け取る。`today-dashboard.tsx`（今日の献立）が存在。これらを集約可能。
- モック「ようこそ」は挨拶＋統計カード＋レシピ候補カード＋小リスト。

## 仕様

- TKT-0157 のサイドバー/ナビに「ホーム」追加（モード追加 or 別ルートは本specで確定）。
- ホームに挨拶・サマリーカード・今日の献立・レシピ候補・在庫アラートを配置。遷移は `returnToMode` / `requestViewRecipe` を流用。
- 初期ランディング（PC: ホーム or 食材管理）とスマホでの扱いを確定。
- 既存データのみ集約。新規クエリを増やさない。埋められない項目は出さない（飾りで埋めない）。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- 新規データソース・新規DBクエリの追加
- スマホ専用の新ダッシュボード（本specはPC中心、スマホは扱いを定義するのみ）
- 各画面の多カラム化（TKT-0158〜0160）
