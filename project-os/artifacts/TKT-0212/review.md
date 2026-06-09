---
ticket_id: TKT-0212-schedule-delete-cascade-shopping-items
status: passed
review_scope:
  - TKT-0212-schedule-delete-cascade-shopping-items
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- `supabase/migrations/20260609120000_shopping_items_meal_schedule_link.sql`（新規）
- `web/src/components/recipe-meal-workspace.tsx`（addScheduleEntry 戻り値・紐付け state・INSERT 列追加・deleteSchedule 連動削除・確認文面）
- `web/src/__tests__/recipe-meal-workspace.test.tsx`（連動削除・紐付け・確認文面のテスト）

## checked_artifacts

- `project-os/artifacts/TKT-0212/verify.json`（status=pass）
- `project-os/artifacts/TKT-0212/report.md`
- `project-os/artifacts/TKT-0212/manual-smokes.md`

## subagent_usage

- なし（変更範囲が単一コンポーネント＋1 migration に限定されるため、メインで静的レビュー）。

## findings

- [情報] migration の複合FK は **列指定** `on delete set null (meal_schedule_id)` を使用。user_id が not null のため
  通常の SET NULL は不可。既存 `20260523095800_fix_composite_fk_delete_actions.sql` と同方式で一貫。問題なし。
- [情報] 削除順序は「buy 削除 → schedule 削除」。FK が on delete set null のため逆順だと紐付けが先に失われる。
  コード・コメントで順序厳守を明示。妥当。
- [情報] 関連買い物削除が失敗したら献立を削除せず中断（部分実行を避ける）。整合性の観点で適切。
- [情報] 紐付けは `status=未購入` のみ削除対象。購入済みは履歴として残す方針（ユーザー確定）。
- [情報] RLS は既存 `shopping_items_*_own` で保護。列追加に伴う新規ポリシーは不要。delete も `eq("user_id", userId)`
  ＋RLS の二重で自分の行に限定。
- [軽微] `ShoppingItem` TS 型（`web/src/lib/recipes/types.ts`）には meal_schedule_id を追加していない。本機能は
  書き込み（INSERT / フィルタ delete）専用で読み出し表示に使わないため影響なし。将来読み出すなら型追加を検討。

## open_risks

- migration の hosted 未適用（公開前適用ゲート）。未適用のまま公開すると INSERT 失敗。report / manual-smokes に明記。

## verdict

- pass（危険変更だが schema 列追加＋既存RLS範囲内。順序・失敗時中断・紐付け範囲が妥当。migration 本番適用と実機スモークはユーザー作業として残す）。
