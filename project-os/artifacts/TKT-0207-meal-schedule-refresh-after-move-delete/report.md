# TKT-0207 実装レポート

## 結論

スケジュール移動・削除後に別画面へ移って戻ると古い表示へ戻る不具合を修正した。
原因は、Supabaseへの保存成功後に `router.refresh()` を呼んでおらず、親の `page.tsx` が持つ
`initialMealSchedules` が古いまま再利用されていたこと。

## 変更内容

- `web/src/components/recipe-meal-workspace.tsx`
  - `moveScheduleToSlot` のDB更新成功後に `router.refresh()` を追加。
  - `deleteSchedule` のDB削除成功後に `router.refresh()` を追加。
  - 失敗時のロールバック、エラートースト、既存の楽観的更新は維持。

- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - スケジュール移動成功時に `router.refresh()` が呼ばれることを追加確認。
  - 未完了スケジュール削除成功時に `router.refresh()` が呼ばれることを追加確認。
  - 完了済みスケジュール削除（在庫/履歴巻き戻しあり）成功時にも `router.refresh()` が呼ばれることを追加確認。

## 検証

- `npm test -- recipe-meal-workspace.test.tsx`: pass（43 tests）
- `npm run typecheck`: pass
- `npm run lint`: pass（既存warning 1件あり: `web/src/lib/format/quantity-notation.ts` の未使用変数）
- `npm run build`: pass（同じ既存warningあり）
- `harness/bin/verify_web.sh TKT-0207-meal-schedule-refresh-after-move-delete`: `VERIFY_PASSED`

verify結果:

- `project-os/artifacts/TKT-0207-meal-schedule-refresh-after-move-delete/verify.json`

## 非変更

- DBスキーマ、RLS、Supabase Auth、Storage、環境変数は変更なし。
- Canvas版 `app.html` は変更なし。
- APIキーや秘密鍵の直書きなし。

## 残リスク

- `router.refresh()` によりサーバデータを再取得するため、既存の写真表示など他領域の再取得が発生する可能性はある。
  ただし、完了解除・調理完了など既存フローでも同じ方針を使っており、今回もその設計に揃えた。
- Vitest実行中に既存のReact warning（同一key `schedule-1`）が出るが、今回変更前からあるテストデータ起因の警告で、テストは全件pass。
