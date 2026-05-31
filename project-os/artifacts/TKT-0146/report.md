# TKT-0146 実装レポート

## 結論

献立・レシピのスケジュール画面（7日ウィンドウ）を、Canvas版と同じく**常に今日を中央（today-3〜today+3）**に置くよう変更した。あわせて request #1（AIメッセージの上部ステータスバー表示）は TKT-0145 で対応済みであることを確認した。

## 背景

- スクリーンショットの緑バナー「AIレシピ案を作成しました。内容を確認してからフォームへ反映してください。」は TKT-0145 で削除された旧 aiPreview 機能のもの。現行 main では `showStatusMessage` で上部ステータスバーへ送られ、本文側は `sr-only`（非表示）。→ request #1 はコード上すでに実装済み（スクショは TKT-0145 適用前）。
- スケジュールは週起点が「最初の献立の日付」だったため、今日が窓の端（例: 7日中6番目）に寄っていた。Canvas版（`app.html` `getWeekDates`、`startDate = today - 3`）は今日中央。

## 変更内容

- `web/src/components/recipe-meal-workspace.tsx`
  - 初期 `scheduleWindowStart` を「最初の献立日付」から `addDays(todayValue(), -3)`（今日中央）に変更。
  - `scheduleDate`（追加フォーム既定）を `todayValue()` に変更。
  - 「今週」ボタンの戻り先を `todayValue()`（今日が左端）から `addDays(todayValue(), -3)`（今日中央）に変更。
  - 不要になった `initialScheduleStart` を削除。
  - 前後の週（±7）・1日シフト（±1）は相対計算のため変更なし。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 今日中央描画になり固定日付スケジュール（5/25・5/26）が実行日依存になるため、`vi.useFakeTimers({ toFake: ["Date"] })` + `setSystemTime("2026-05-28T12:00:00")` で today を固定（窓 = 5/25〜5/31）。`setTimeout` は実タイマーのままで `waitFor` を壊さない。

## Canvas版の確認

`app.html` `getWeekDates(offset)`（4235行付近）: `startDate.setDate(today.getDate() + dayOffset - 3)` で 7日中4番目に今日。`dayOffset===0` が「今週」。今日中央が正しい仕様であることを確認した。

## セキュリティ

- UIのクライアントロジックのみ。schema / auth / RLS / Storage / AI route / CSV移行 / データ削除は変更なし。

## verify

- `harness/bin/verify_web.sh TKT-0146` → status: pass（lint/typecheck/test/build + policy すべて pass）。
- 出力: `project-os/artifacts/TKT-0146/verify.json`
