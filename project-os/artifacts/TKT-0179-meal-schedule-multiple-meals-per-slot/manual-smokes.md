---
ticket_id: TKT-0179-meal-schedule-multiple-meals-per-slot
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `supabase_schema_change`: `/check-gates` が作業ツリー全体の未コミット変更や `meal_schedules` などの語に反応した過剰検出。本チケットはDBスキーマ、migration、RLS、policyを変更しない。
- `photo_upload_storage`: 作業ツリーに写真関連の未コミット変更が混在しているための過剰検出。本チケットは画像圧縮、写真アップロード、Supabase Storage保存を変更しない。

## executed_checks

- 本チケットの実装差分が以下に限定されていることを確認。
  - `web/src/components/recipe-meal-workspace.tsx`
  - `web/src/app/globals.css`
  - `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - `project-os/artifacts/TKT-0179-meal-schedule-multiple-meals-per-slot/`
- `supabase/` 配下を編集していないことを確認。
- APIキー、Supabase秘密鍵、Storageバケット名や保存処理を追加していないことを確認。
- `verify.json` の policy が全 pass であることを確認。
  - `no_gas_dependency`: pass
  - `no_hardcoded_secret`: pass
  - `supabase_rls_present`: pass
- ブラウザ確認:
  - PC幅: スケジュール画面に21スロット、実データ上のカード4件を確認。スロットは `display:flex` / `overflow:visible`。
  - スマホ幅390px: スケジュール画面に21スロット、カード4件、カード横はみ出し0件を確認。

## skipped_checks

- 実DBに重複献立を新規追加する手動確認は未実施。実データを書き換えるため、自動テストで代替した。
- 実Storageへのアップロード確認は対象外。本チケットはStorage処理を変更しない。

## open_risks

- 1スロットに大量の献立を入れた場合は縦に長くなる。今回はTKTどおり自然に伸ばす方針。
