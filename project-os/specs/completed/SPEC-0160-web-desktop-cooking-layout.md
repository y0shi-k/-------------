---
id: SPEC-0160-web-desktop-cooking-layout
title: 料理・記録のPC多カラム化（タイムライン/カレンダー/インサイトの広幅化）
status: draft
scope:
  - web/src/components/cooking-history-board.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - スマホ幅（<1024px）の表示・挙動を変えない
  - 写真Storage・記録保存ロジックは変更しない。レイアウトのみ
  - TKT-0157（デスクトップシェル）完了が前提
  - ログイン必須・RLS・Storage非公開・APIキー非露出を守る（署名付き写真URLを表示・ログに出さない）
acceptance:
  - 【IA: グループ化ツリー】PCはサイドバー葉「カレンダー/タイムライン/インサイト」でビュー切替。`.cooking-view-tabs` はPCで隠しサイドバーに一本化（スマホは内部タブ維持）。`historyView` はシェルから controlled/initial prop で駆動
  - PC幅でサマリー・タイムライン・カレンダー・インサイトが広幅で見やすく配置される
  - PC幅で履歴カードが余白を活かしたレイアウト（必要なら複数カラム）になる
  - カレンダー・インサイトが広幅で破綻しない
  - 記録の追加/編集・完了記録・写真・評価が崩れず動く
  - スマホ幅では従来表示を維持
  - Web版verifyが通る
related_tickets:
  - TKT-0160-web-desktop-cooking-layout
---

# Summary

PC幅で `CookingHistoryBoard` を広画面向けに多カラム化する。サマリー/タイムライン/カレンダー/インサイトの配置を余白を活かして整える。スマホ温存。

## 背景

- 料理・記録は `cooking-history-board.tsx`。サマリー（`.cooking-summary-grid`）・タイムライン（`.history-item`）・カレンダー（`.calendar-*`）・インサイト（`.insight-grid`）。
- 一部は多列だが全体は中央660px列前提で、広幅化すると間延びする。

## 仕様

- 広画面でタイムライン/カレンダー/インサイトを横並び、または履歴カードを複数カラムにするなど余白を活かす配置に。
- ビュー切替・履歴カード・カレンダーセル・インサイトパネルの構造は維持。
- CSS（デスクトップ用メディアクエリ）優先、JSX変更は最小化。スマホ用CSSは触らない。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- 写真Storage・記録保存ロジックの変更
- スマホ表示の変更
- 設定・ホーム・検索（別チケット）
