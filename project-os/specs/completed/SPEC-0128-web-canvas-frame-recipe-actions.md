---
id: SPEC-0128-web-canvas-frame-recipe-actions
title: Web版共通フレームとレシピ集3導線復元
status: spec_ready
scope:
  - web/
  - web-mode-shell.tsx
  - recipe-meal-workspace.tsx
  - globals.css
constraints:
  - Canvas版 `app.html` は変更しない
  - GAS/Spreadsheet/Driveは使わない
  - APIキーやSupabase秘密鍵をブラウザへ出さない
  - このチケットではモーダル詳細実装を広げず、入口復元と画面土台に絞る
acceptance:
  - Web版の主要画面がCanvas版に近い中央カラム幅で表示される
  - 下部3ナビで `食材管理` / `献立・レシピ` / `料理・記録` を切り替えられる
  - 上部に処理状態が分かるステータス表示がある
  - レシピ集上部に `新規レシピ` / `テキストから追加` / `AI考案` の3ボタンが並ぶ
  - スマホ表示で下部ナビと3ボタンが押しやすい
  - Web版verifyが通る
related_tickets:
  - TKT-0128-web-canvas-frame-recipe-actions
---

# Summary

Web版を直す最初の小さな実装単位。全画面確認の土台になる共通フレームをCanvas版へ寄せ、レシピ集で迷子になっている3つの入口を先に復元する。

# Notes

`テキストから追加` と `AI考案` の中身は後続チケットでCanvas版と同じモーダル導線へ戻す。このチケットでは、ユーザーがレシピ集上部で入口を見つけられる状態を合格にする。
