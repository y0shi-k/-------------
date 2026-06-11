---
ticket_id: TKT-0234-youtube-embed-foundation
status: passed
execution_mode: static_only
target_evals:
  - web_project_bootstrap
  - supabase_schema_change
  - auth_and_rls_policy
  - photo_upload_storage
  - csv_import_migration
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- web_project_bootstrap（チケットの required_evals。非危険。next.config.ts の CSP 変更が該当）
- supabase_schema_change / auth_and_rls_policy / photo_upload_storage / csv_import_migration は `/check-gates` の自動マッチだが、これは**並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更（supabase migration 等）が同一作業ツリーに同居している**ためと、語彙の過剰マッチによるもの。本チケットの実変更3ファイル（youtube.ts / youtube.test.ts / next.config.ts）に schema / auth / Storage / CSV の変更はない。

## executed_checks

- ユニットテスト（vitest）32件で次を確認:
  - watch?v= / youtu.be/ / shorts/ / embed/ の4形式＋クエリ付き・末尾スラッシュから videoId が取れる。
  - 偽装ドメイン（evil-youtube.com / fake.youtube.com）・11文字でないID・無効文字・非URL文字列・空文字はすべて null。
  - 改行区切り複数行から最初の videoId を返し、URLでない行が混在しても誤抽出しない。
- `npm run build` で本番ビルドが通り、CSP 文字列の組み立て（cspDirectives join）が壊れていないことを確認。
- コードレビューで以下を確認:
  - `web/next.config.ts` の diff は `frame-src https://www.youtube-nocookie.com` の1行追加のみ（git diff で確認）。
  - 本チケットとして `supabase/` 配下・auth コード・Storage アクセス・scripts/ に変更なし。

## skipped_checks

- 実ブラウザでの iframe 表示確認（本チケットは UI 未実装のため確認対象が存在しない。TKT-0235 の実機スモークで CSP violation なしを確認する）。

## open_risks

- なし（純関数＋CSP1行の追加。データ・権限への影響なし）。
