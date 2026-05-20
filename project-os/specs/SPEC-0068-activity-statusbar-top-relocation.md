---
id: SPEC-0068-activity-statusbar-top-relocation
title: 常設ステータスバーと同期バーの上部入れ替え
status: spec_ready
scope:
  - activityStatusBar と syncBar の上部固定位置
  - main#app と bottomNav の余白調整
  - GeminiCanvas 更新後のタップ阻害回避
constraints:
  - スプレッドシートスキーマは変更しない
  - GAS通信、同期payload、state.pendingSync の構造は変更しない
  - syncPendingChanges() 以外の書き込み系 executeGAS(payload...) を追加しない
  - 既存の syncBar 同期ロジックは維持する
acceptance:
  - activityStatusBar が画面最上部に固定表示される
  - activityStatusBar は pointer-events-none を維持し、押下対象にならない
  - syncBar が activityStatusBar の直下に表示され、破棄/同期するボタンが最上部のクリック不能領域から外れる
  - activityStatusBar の内容幅が現状より少し広くなる
  - bottomNav が activityStatusBar 分だけ上に押し上げられない
  - main#app の上余白が activityStatusBar + syncBar の固定配置に合わせて調整される
  - verify がパスする
related_tickets:
  - TKT-0068-activity-statusbar-top-relocation
---

# Summary

GeminiCanvas の更新後、画面最上部にクリックできない領域ができ、そこに `#syncBar` の「破棄」「同期する」ボタンが重なると操作できない。最上部には押下不要の `#activityStatusBar` を固定し、その直下のクリック可能な位置に `#syncBar` を表示する。

## 背景

- 既存の `#syncBar` は未同期時だけ上部に表示されるが、ボタンを含むためクリック不能領域に置けない。
- `#activityStatusBar` は常設の下部ステータス領域として実装されている。
- `#activityStatusBar` は表示専用で `pointer-events-none` を持つため、クリック不能領域に置いても操作上の問題が少ない。

## 仕様

- `#activityStatusBar` を `bottom-0` から `top-0` へ移す。
- `#activityStatusBar` は `pointer-events-none` を維持し、クリック対象にならないようにする。
- 表示幅は `max-w-2xl` より少し広い値へ変更する。
- `#syncBar` は `#activityStatusBar` の直下に固定し、表示時の「破棄」「同期する」ボタンをクリック可能な高さへ下げる。
- `#syncBar` の非表示時は、activityStatusBar 領域に残らないよう上方向へ完全に退避する。
- `#bottomNav` はステータスバー分の押し上げをやめ、通常の下部固定に戻す。
- `main#app` は上部の `syncBar` と `activityStatusBar` の常設領域を前提に上余白を確保する。
- `main#app` の下余白はボトムナビ分を確保し、activityStatusBar 分は含めない。

## 非対象

- Spreadsheet / Drive / GAS の通信仕様
- 未同期バー `#syncBar` の同期ロジック
- 初期起動、AI生成、画像解析などのブロッキング処理
- ボタン自体の配置や文言変更
