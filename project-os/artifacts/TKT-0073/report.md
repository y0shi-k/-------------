---
ticket: TKT-0073-schedule-day-shift-controls
status: ready
---

# Report

Mode B スケジュール画面の7日リスト上下に日送りボタンを追加した。

## Changes

- `scheduleDayOffset` を追加し、今日中心表示からの日単位 offset で7日範囲を計算するようにした。
- `↑` は1日過去、`↓` は1日未来へ移動する。
- 前の週 / 次の週は、日送り済みの現在位置から7日単位で移動する。
- 今週ボタンは今日中心表示へ戻る。
- レシピ詳細からスケジュール追加後、追加日を含む7日表示へ移動する挙動を維持した。

## Verification

- 標準 verify: PASS
- 禁止ダイアログ静的確認: PASS
- 新規スプシ書き込み通信なし

## Manual Browser Test

Gemini Canvas 上の実表示確認は `manual-smokes.md` のシナリオに沿ってユーザーが実施する。
