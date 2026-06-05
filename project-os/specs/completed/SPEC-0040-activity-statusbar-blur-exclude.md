---
id: SPEC-0040
title: ステータスバーぼかし除外（z-index引上げ）
status: spec_ready
scope:
  - `app.html` の `#activityStatusBar` 要素
constraints:
  - 既存のぼかしオーバーレイ・モーダルの挙動は変更しない
  - Spreadsheet書き込み、GAS通信、データスキーマは変更しない
  - ステータスバーの表示内容・レイアウトは変更しない
acceptance:
  - `#activityStatusBar` の z-index が `z-[90]`（または全ぼかしオーバーレイを上回る値）に変更されている
  - 初期同期画面、AI解析中、全モーダル表示時に `#activityStatusBar` がぼかされない
  - 既存verifyが通る
related_tickets:
  - TKT-0040-activity-statusbar-blur-exclude
---

# Summary

`#activityStatusBar`（画面下部常設ステータスバー）の z-index を、全 `backdrop-blur` オーバーレイより前面に引き上げ、ぼかし効果を受けないようにする。

## 背景

- `#activityStatusBar` は `z-[55]` で固定されていた
- ぼかしオーバーレイ群は `z-[65]`〜`z-[75]` の範囲に存在し、ステータスバーに `backdrop-filter` が適用されていた
- TKT-0031 で常設ステータスバー化したが、z-index はそのままだった

## 変更方針

`#activityStatusBar` のクラスから `z-[55]` を削除し、`z-[90]` に変更する。Toast 通知（`z-[80]`）より前面に出るが、ステータスバーは `pointer-events-none` で操作を奪わないため問題ない。
