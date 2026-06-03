---
id: SPEC-0158-web-desktop-inventory-layout
title: 食材管理のPC多カラム化（食材一覧グリッド＋AI食材登録レイアウト）
status: draft
scope:
  - web/src/components/inventory-board.tsx
  - web/src/components/today-dashboard.tsx
  - web/src/components/shopping-list-section.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - スマホ幅（<1024px）の表示・挙動を変えない
  - 写真Storageアップロード・AI解析API（scan-ingredients）のロジックは変更しない。レイアウトのみ
  - TKT-0157（デスクトップシェル）完了が前提
  - ログイン必須・RLS・Storage非公開・APIキー非露出を守る（写真URL/Gemini APIキーを表示・ログに出さない）
acceptance:
  - 【IA: グループ化ツリー】PCはサイドバー葉「在庫一覧/買い物リスト」でサブビュー切替。コンテンツ内の表示切替はPCで隠しサイドバーに一本化（スマホは内部切替維持）。サブビュー state はシェルから controlled/initial prop で駆動
  - PC幅で食材一覧が複数カラムのカードグリッドになる（モック「食材一覧」相当）
  - PC幅でAI食材登録がアップロード枠＋認識チップのグリッド配置になる（モック「AI食材登録」相当）
  - 保存場所タブ・並び順・選択/すべて選択・数量ステッパー・編集/削除・買い物リスト・登録待ち入口が崩れず動く
  - スマホ幅では従来表示を維持
  - Web版verifyが通る
related_tickets:
  - TKT-0158-web-desktop-inventory-layout
---

# Summary

PC幅で `InventoryBoard` を添付モックの「食材一覧」「AI食材登録」へ寄せる。広画面で単一カラム→多カラムのカードグリッドにする。スマホ温存。

## 背景

- 食材管理は `inventory-board.tsx`。`today-dashboard`（今日の献立）と `shopping-list-section`（買い物リスト）を内包。
- `.inventory-grid` は現状 `1fr` で広画面でも単一カラム寄り。既存の絵文字パステルタイル・`.stock-panel` を流用可能。

## 仕様

- `.inventory-grid` / 食材一覧をデスクトップ幅で複数カラム化。保存場所タブ・並び替え・選択UIは維持。
- AI食材登録（`.photo-scan-modal` / `.scan-candidate-*`）をデスクトップ幅でアップロード枠＋候補チップのグリッドに再配置。
- まずCSS（デスクトップ用メディアクエリ追加）で実現できる範囲を優先し、JSX変更は最小化。スマホ用CSSは触らない。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- 写真Storage/AI解析のロジック変更
- スマホ表示の変更
- 設定・ホーム・検索（別チケット）
