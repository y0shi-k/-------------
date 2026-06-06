---
ticket_id: TKT-0179-meal-schedule-multiple-meals-per-slot
status: ready
generated_at: 2026-06-06T12:11:17+09:00
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

7日献立スケジュールで、同じ日付・同じ食事タイプ（朝/昼/晩）に複数の献立がある場合、先頭1件だけでなく全件が縦に表示されるようにする。

## 今回追加した安全装置

- `web/src/components/recipe-meal-workspace.tsx`
  - スロット内の献立取得を `find` から `filter` に変更。
  - 同一スロットの `meal_schedules` を `map` で全件カード描画するように変更。
  - 空スロット判定を `slotSchedules.length === 0` に変更。
  - 各カードの選択状態、ドラッグ、削除ボタン、完了表示は従来どおり各 `schedule.id` 単位で動く構造を維持。

- `web/src/app/globals.css`
  - `.schedule-slot` のカード間隔を少し広げた。
  - スロットの `overflow` を `visible` にし、複数カードで見切れにくい状態に変更。

- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 同じ `scheduled_on` + `meal_type` に2件の献立を渡し、両方のカード操作ボタンが表示されるテストを追加。

- DBスキーマ変更なし。
- Supabase RLS / Storage / Auth 変更なし。
- APIキーや秘密情報の追加なし。
- Canvas版 `app.html` は未変更。
- GAS / Spreadsheet / Drive 依存の追加なし。

## 実施した確認

- `npm test -- recipe-meal-workspace.test.tsx`: pass（30 tests）
- `harness/bin/verify_web.sh TKT-0179-meal-schedule-multiple-meals-per-slot`: pass
  - lint: pass
  - typecheck: pass
  - test: pass（204 tests）
  - build: pass
  - no_gas_dependency: pass
  - no_hardcoded_secret: pass
  - supabase_rls_present: pass
  - backlog_focus_lean: pass
- `python3 harness/bin/check_gates.py TKT-0179-meal-schedule-multiple-meals-per-slot`
  - 単独のTKT-0179変更のみでは軽量UI変更だが、作業ツリーに別チケット由来の未コミット変更が混在しているため `supabase_schema_change` / `photo_upload_storage` を過剰検出。
  - 本チケットの実変更は `web/src/components/recipe-meal-workspace.tsx`、`web/src/app/globals.css`、`web/src/__tests__/recipe-meal-workspace.test.tsx` と artifact のみ。`supabase/`、Storage保存処理、Auth/RLS、APIキー処理は変更していない。

## 残リスク

- 全体テスト中、既存の「adds a recipe to the meal schedule」テストで React の重複key警告（`schedule-1`）が出る。今回追加した複数表示テストは `schedule-1` / `schedule-2` を使っており、今回の変更による失敗ではない。テスト結果は pass。
- 1スロットに大量の献立を入れると縦に長くなる。今回はTKTどおり自然に伸ばす方針で、折りたたみやスロット内スクロールは入れていない。

## 目視確認

ローカル開発サーバー `http://localhost:3002` で確認。

- PC幅: スケジュール画面を表示。21スロット、実データ上のカード4件を確認。スロットは `display:flex` / `overflow:visible`。
- スマホ幅 390px: スケジュール画面を表示。21スロット、カード4件、カード横はみ出し0件を確認。スロットは `overflow:visible`。
- 実データを壊さないため、ブラウザから新規の重複献立追加は行っていない。同一スロット複数件の表示は自動テストで確認済み。

## 次の依頼や人判断

- 作業ツリーにTKT-0178や写真関連と思われる未コミット変更が混在している。`check_gates.py` は作業ツリー全体を見るため、チケット単位でコミットすると過剰検出を減らせる。
- 実データで同一スロットに複数献立を追加する確認は、データ変更を伴うため実施していない。必要ならユーザー操作で確認する。
