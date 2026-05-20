---
ticket_id: TKT-0068-activity-statusbar-top-relocation
status: passed
execution_mode: static_only
target_evals:
  - ui_component_update
---

# Manual Smokes

## target_evals

- `ui_component_update`

## executed_checks

- `#activityStatusBar` が `bottom-0` ではなく `top-0` の最上部固定になっていることを確認
- `#activityStatusBar` が `pointer-events-none` を維持していることを確認
- `#syncBar` が `--activity-status-height` 分だけ下がり、同期ボタンが最上部領域から外れていることを確認
- `sync-bar-hidden` が `activityStatusBar` 領域に残らないよう、上方向へ完全退避する指定になっていることを確認
- `activity-status-content` が `max-w-2xl` から `max-w-3xl` へ広がっていることを確認
- `#bottomNav` の下端指定から `--activity-status-height` が外れていることを確認
- `#app` の下余白から `--activity-status-height` が外れ、上余白に反映されていることを確認
- `alert(` / `confirm(` / `prompt(` の新規追加がないことを確認
- `syncPendingChanges()` 以外の書き込み系 `executeGAS(payload...)` を追加していないことを確認

## skipped_checks

- GeminiCanvas 実機でのタップ確認は未実施。`app.html` をCanvasに貼り付けた後、`破棄` / `同期する` とアプリ上部ボタンが押せることを確認する。

## open_risks

- GeminiCanvas の固定レイヤー実装差分はローカル静的確認では完全には再現できない。
