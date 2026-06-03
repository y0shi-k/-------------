---
ticket_id: TKT-0159-web-desktop-recipe-meal-layout
status: passed
execution_mode: automated_and_browser
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
---

# TKT-0159 manual smokes

実行日時: 2026-06-03 22:55 JST

## target_evals

- `supabase_schema_change`（危険eval・過剰マッチ）: `recipe-meal-workspace.tsx` の既存文脈に `meal_schedules` / `recipes` などのDB語が含まれるため反応。今回の変更はレイアウトとShell表示同期のみで、`supabase/` は未編集。
- `auth_and_rls_policy`（危険eval・過剰マッチ）: `useShellSubView()` 連携追加によりShell文脈が差分に出たため反応。Auth、セッション、RLS policy は変更していない。
- `photo_upload_storage`（危険eval・過剰マッチ）: 同ファイルに既存の調理写真アップロード処理があるため反応。今回の差分では写真圧縮、Storage path、署名URL、アップロード処理を変更していない。

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| verify一式 | pass | `harness/bin/verify_web.sh TKT-0159-web-desktop-recipe-meal-layout` で lint/typecheck/test/build/policy すべて pass |
| 対象テスト | pass | `npm run test -- recipe-meal-workspace.test.tsx` で 24 tests pass |
| Shell連動 | pass | `selectedSubViews.recipes = "schedule"` でスケジュール表示に切り替わるテストを追加 |
| 内部タブ同期 | pass | 内部タブ「スケジュール」押下で `selectShellLeaf("recipes", "schedule")` が呼ばれるテストを追加 |
| PCブラウザ確認 | pass | 1280px幅で `.recipe-subnav` 非表示、レシピ一覧3列、スケジュール7列×3行相当を確認 |
| スマホブラウザ確認 | pass | 390px幅で `.recipe-subnav` 表示、レシピ一覧1列、従来の縦アジェンダ表示を確認 |
| DB/Auth/Storage変更なし | pass | `supabase/` 未編集。AI route、保存処理、写真Storage処理、APIキー管理は変更なし |
| policy チェック | pass | GAS依存なし、秘密直書きなし、RLS存在確認 pass |

実行コマンド:

```bash
npm run test -- recipe-meal-workspace.test.tsx
npm run typecheck
harness/bin/verify_web.sh TKT-0159-web-desktop-recipe-meal-layout
harness/bin/check_gates.py TKT-0159-web-desktop-recipe-meal-layout
```

## skipped_checks

- 実スマホ端末でのタップ操作は未実施。ブラウザviewport 390pxでスマホ幅レイアウトは確認済み。
- ドラッグ&ドロップの手操作は未実施。既存の自動テストで `moveScheduleToSlot` 経由の移動保存は継続確認済み。

## open_risks

- 1024px境界付近のタブレット実機では、スケジュール7列表示の横幅が狭く感じる可能性がある。
- 実データでレシピ名が長い場合、PCスケジュールカードでは省略表示が増える可能性がある。
