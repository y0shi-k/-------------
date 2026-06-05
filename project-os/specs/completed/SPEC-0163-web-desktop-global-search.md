---
id: SPEC-0163-web-desktop-global-search
title: 上部バーの横断検索の機能化（食材・レシピ）
status: draft
scope:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 既存クライアント保持データのクライアント側絞り込みに限定。新規検索API・新規DBクエリを作らない
  - 非危険変更（schema/auth/RLS/Storage/AI route は変更しない）
  - TKT-0157（上部バーの検索スロット）完了が前提
  - ログイン必須・RLS・Storage非公開・APIキー非露出を守る
acceptance:
  - 上部バーの検索で食材・レシピを横断的に絞り込める
  - 結果から該当モード/アイテムへ遷移できる
  - 既存の各モード内フィルタと競合せず共存する
  - 検索対象は既存クライアント保持データに限る（その旨が明示される）
  - スマホ幅での検索の出し方が spec の決定どおりに動く
  - Web版verifyが通る
related_tickets:
  - TKT-0163-web-desktop-global-search
---

# Summary

TKT-0157 の上部バー検索スロットを機能化する。既存クライアント保持データを対象に食材・レシピを横断絞り込みし、該当モード/アイテムへ遷移する。サーバー検索APIは作らない。

## 背景

- 各ボードは `page.tsx` の初期データをクライアント保持。各モードにローカルフィルタが既にある。
- モックの各画面上部に検索バーがある。

## 仕様

- 検索 state を `web-mode-shell.tsx` / `ShellStatusContext` で保持。
- 検索対象（食材・レシピ）・結果UI・遷移（`returnToMode`/`requestViewRecipe`）を確定。
- クライアント側絞り込み限定。新規API/クエリを作らない。デバウンスは `useDebounce` パターン参考可。
- スマホでの出し方を定義。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- サーバー検索API・新規DBクエリ
- 全文検索/あいまい検索の高度化（まずは単純な部分一致）
- 各画面の多カラム化（TKT-0158〜0160）
