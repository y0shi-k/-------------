---
id: TKT-0250-recipe-card-actions-always-clickable
title: PCレシピカード上部の操作ボタンが一瞬で消えて押せない問題を直す
status: implementation_ready
goal: 献立レシピ画面のPCレシピカードで、写真エリア右上の料理・スケジュール・編集・削除ボタンを常時クリック可能にする
acceptance:
  - PC幅のレシピカードで、写真エリア右上の操作ボタンがすぐ消えずクリックできる
  - 通常時も操作ボタンの存在が分かる
  - hover / focus 時は従来どおり操作ボタンが明瞭に見える
  - スマホ幅のレシピカード表示・操作を壊さない
  - DB schema、Supabase Auth/RLS、Storage、AI API route は変更しない
  - Web版 verify が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0250-recipe-card-actions-always-clickable/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0250-recipe-card-actions-always-clickable/verify.json
  - artifacts/TKT-0250-recipe-card-actions-always-clickable/report.md
owner_role: implementer
owner_notes:
  - verify は `harness/bin/verify_web.sh TKT-0250-recipe-card-actions-always-clickable`
  - 非危険変更（CSSのみ）
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、写真URL、Storage path を直書きしない
---

# Summary

PC幅のレシピカードはTKT-0166で縦型化され、操作ボタンが写真右上のhoverオーバーレイへ退避された。現在は通常時 `opacity: 0; pointer-events: none;` のため、hover判定が切れると一瞬で消えて押せないことがある。

## 実装メモ

- 対象は `web/src/app/globals.css` の `@media (min-width: 1024px)` 内 `.recipe-card .recipe-card-actions`。
- 通常時も `pointer-events: auto` にし、薄く表示する。
- hover / focus 時は `opacity: 1` にして従来どおり明瞭にする。
- JSX、DB、API、Storage、Auth/RLS は変更しない。

## 非対象

- レシピカード全体のデザイン刷新
- ボタン種類の変更
- アイコン差し替え
- スマホレイアウトの作り直し
