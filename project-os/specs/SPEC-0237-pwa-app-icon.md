---
id: SPEC-0237-pwa-app-icon
title: ホーム追加時のPWAアプリアイコン設定
status: draft
scope:
  - Web版のPWA/ホーム画面追加用アイコン
  - Next.js metadata の icon / apple touch icon / manifest 設定
  - web/public 配下の静的アイコン画像
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー・Supabase秘密鍵などの秘匿情報は追加しない
  - DB schema / Auth・RLS / Storage / AI route は触らない
acceptance:
  - 買い物かご + 食材の生成画像をWeb版のホーム追加用アイコンとして参照できる
  - iOS向け apple touch icon と、PWA manifest の 192px / 512px アイコンが設定される
  - `web/src/app/layout.tsx` の metadata から manifest と各アイコンが参照される
  - 既存画面のUI・認証・データ処理の挙動は変わらない
related_tickets:
  - TKT-0237-pwa-app-icon
---

# Summary

スマホやタブレットでWeb版をホーム画面に追加したとき、汎用アイコンではなく Stock Master 用の「買い物かご + 食材」アイコンが表示されるようにする。

## 仕様

- 生成済みの買い物かごアイコンを `web/public/icons/` に配置する。
- ブラウザが用途ごとに選べるよう、以下の画像を用意する。
  - `stock-master-icon-192.png`
  - `stock-master-icon-512.png`
  - `apple-touch-icon.png`
  - 原寸保存用 `stock-master-icon-1024.png`
- `web/public/manifest.json` を追加し、PWA名・テーマカラー・アイコンを定義する。
- `web/src/app/layout.tsx` の metadata に `manifest` と `icons` を追加する。

## 非対象

- アイコンデザインの追加生成・差し替え。
- PWA の Service Worker / オフライン対応。
- 画面デザインやナビゲーションの変更。
