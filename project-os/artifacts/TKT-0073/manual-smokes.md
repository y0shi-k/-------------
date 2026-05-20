---
ticket: TKT-0073-schedule-day-shift-controls
status: ready_for_user_browser_test
---

# Manual Smokes

ユーザーが Gemini Canvas 上で `app.html` を貼り付けて確認する。

## Scenarios

- Mode B のスケジュールを開き、初期表示が今日中心の7日分であることを確認する。
- 7日リスト上部の `↑` を押し、表示範囲が1日過去へ戻ることを確認する。
- 7日リスト下部の `↓` を押し、表示範囲が1日未来へ進むことを確認する。
- 日送り後に「次の週」を押し、現在位置から7日未来の7日分へ移動することを確認する。
- 日送り後に「前の週」を押し、現在位置から7日過去の7日分へ移動することを確認する。
- 「今週」を押し、今日中心の7日分へ戻ることを確認する。
- 選択モード、選択削除、D&D、各食事枠の追加ボタンが崩れず操作できることを確認する。

## Static Checks Done

- HTML parse verify: PASS
- `executeGAS` / `GAS_URL` presence: PASS
- `alert(` / `confirm(` / `prompt(`: no matches
- `showToast`: present
- 新規スプシ書き込み通信: none
