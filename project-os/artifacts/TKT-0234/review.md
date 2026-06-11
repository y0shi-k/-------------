---
ticket_id: TKT-0234-youtube-embed-foundation
status: passed
review_scope:
  - SPEC-0226-cooking-viewer-youtube
  - TKT-0234-youtube-embed-foundation
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/youtube.ts（新規・videoId 抽出純関数）
- web/src/__tests__/youtube.test.ts（新規・32ケース）
- web/next.config.ts（frame-src 1行追加）

## checked_artifacts

- project-os/artifacts/TKT-0234/verify.json（status: pass）
- project-os/artifacts/TKT-0234/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲。route_model.py の判定は「非危険 eval のみ: web_project_bootstrap → fast」。オーケストレーター（Fable 5）がコードレビューと verify を実施。

## findings

- **CSP（セキュリティヘッダ変更のため重点確認）**: 追加は `frame-src https://www.youtube-nocookie.com` のみで、許可ドメインは nocookie 1つに限定。`frame-ancestors 'none'` / X-Frame-Options DENY（自アプリ保護側）は不変。script-src 等の他ディレクティブにも diff なし。
- ホスト判定は URL パース＋完全一致 Set で、部分一致・正規表現による偽装ドメイン透過がない。videoId の `[A-Za-z0-9_-]{11}` 検証により、後続 TKT-0235 で embed URL に連結しても安全な値のみが返る。
- `url.pathname.startsWith("/watch?")` 分岐は pathname にクエリが含まれないため実質デッドコードだが、無害（誤動作しない）。
- 関数は副作用なし・React 非依存で、イミュータブル規約に適合。
- 危険 eval の自動マッチ（supabase_schema_change / auth_and_rls_policy / photo_upload_storage / csv_import_migration）は、並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更が同一作業ツリーに存在するためで、本チケットの実 diff 3ファイルに schema / auth / Storage / CSV の変更はないことを git diff で確認した。

## open_risks

- YouTube の新 URL 形式への追従が将来必要になり得る（null フォールバックで安全側）。

## verdict

- passed。CSP の攻撃面拡大は youtube-nocookie の iframe 許可のみに限定され、videoId 検証と合わせて TKT-0235 の前提として妥当。
