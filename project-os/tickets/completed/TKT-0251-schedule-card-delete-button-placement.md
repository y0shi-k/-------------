---
id: TKT-0251-schedule-card-delete-button-placement
title: 献立スケジュールカードの削除ボタンをカード内右上に整える
status: completed
goal: 献立スケジュール画面で、スケジュール済み献立カードの×ボタンをカード内右上に自然に配置し、余計な行や空白を増やさない
acceptance:
  - 献立スケジュールのカードで×ボタンがカード内の右上に見える
  - ×ボタン用の余計な行・縦余白が増えない
  - カードクリックで操作メニューを開く既存動作を壊さない
  - ×ボタンで献立削除確認を開く既存動作を壊さない
  - スマホ幅でもカード内の文字と×ボタンが不自然に重ならない
  - DB schema、Supabase Auth/RLS、Storage、AI API route は変更しない
  - Web版 verify が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - project-os/tickets/TKT-0251-schedule-card-delete-button-placement.md
  - project-os/artifacts/TKT-0251-schedule-card-delete-button-placement/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0251-schedule-card-delete-button-placement/verify.json
  - artifacts/TKT-0251-schedule-card-delete-button-placement/report.md
owner_role: implementer
owner_notes:
  - verify は `harness/bin/verify_web.sh TKT-0251-schedule-card-delete-button-placement`
  - 非危険変更（CSSのみ）
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、写真URL、Storage path を直書きしない
---

# Summary

献立スケジュール画面の予定カードで、削除用の×ボタンがカードと一体に見えず不自然な位置に見える問題を直す。

## 実装メモ

- 対象は `web/src/app/globals.css` の `.schedule-meal-card` 周辺。
- 外側の `.schedule-meal-card` を実際のカード枠にし、内側の `.schedule-meal-select` は透明な全面ボタンにする。
- `.schedule-meal-delete-button` は絶対配置のまま、カード内右上に収める。
- JSX、DB、API、Storage、Auth/RLS は変更しない。

## 非対象

- 献立カードの操作内容変更
- 削除確認文言の変更
- ドラッグ&ドロップ仕様変更
- スケジュールデータ構造の変更
