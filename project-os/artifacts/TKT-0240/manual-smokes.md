---
ticket_id: TKT-0240-user-synonym-group-merge
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（ticket の required_evals）
- `/check-gates` の supabase_schema_change / photo_upload_storage は同一作業ツリー上の並行チケット（TKT-0239 の inventory_items select、チケットmd の写真語彙）による過剰マッチ。本チケットは純粋関数（name-match.ts）とテストのみで、schema / Storage / 写真経路に非接触。

## executed_checks

- `npx vitest run src/__tests__/ingredient-name-match.test.ts` → 61件 全パス（新規5件含む）
- `npx vitest run src/__tests__/user-synonyms.test.ts` → 24件 全パス（回帰なし）
- `bash harness/bin/verify_web.sh TKT-0240` → lint / typecheck / test / build / policy すべて pass

## skipped_checks

- ブラウザ実機での設定画面（同義語辞書の保存→マッチング反映）確認: ロジックは localStorage IO（無変更）の先の純粋関数であり、単体テストで網羅済みのためスキップ

## open_risks

- なし
