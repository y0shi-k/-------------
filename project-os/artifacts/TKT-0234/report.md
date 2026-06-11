---
ticket_id: TKT-0234-youtube-embed-foundation
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

調理ビューアで YouTube レシピ動画をインライン再生する（TKT-0235）ための土台を整えた。現状は YouTube URL 処理が存在せず、CSP も `frame-src` 未定義（`default-src 'self'` フォールバック）のため iframe 埋め込みが全ブロックされる状態だった。

- `web/src/lib/youtube.ts`（新規）: YouTube URL から videoId を抽出する純関数。`extractYoutubeVideoId(text): string | null`（watch?v= / youtu.be/ / shorts/ / embed/ 対応）と、改行区切りテキスト（`recipes.source` 形式）から最初の videoId を返す `findFirstYoutubeVideoId(text): string | null`。React 非依存・副作用なし。
- `web/src/__tests__/youtube.test.ts`（新規）: 正常系13・異常系12・複数行ヘルパー7 の計32ケース。
- `web/next.config.ts`: `cspDirectives` に `frame-src https://www.youtube-nocookie.com` を1要素追加。他ディレクティブ・securityHeaders は無変更。

## 今回追加した安全装置

- ホスト判定は `new URL()` パース＋完全一致リスト（youtube.com / www.youtube.com / m.youtube.com / youtu.be / music.youtube.com）。正規表現だけの判定にせず、`evil-youtube.com` 等の偽装ドメインを弾く（テストで確認）。
- videoId は `[A-Za-z0-9_-]{11}` のみ有効。抽出結果をそのまま埋め込みURLへ連結しても任意文字列インジェクションが起きない値だけを返す。
- CSP の許可は privacy-enhanced モードの `https://www.youtube-nocookie.com` のみ。youtube.com 本体や他ドメインの iframe は引き続きブロックされる。`frame-ancestors 'none'`（自アプリの iframe 化防止）は不変。

## 実施した確認

- `/verify TKT-0234`（= `harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）も pass。`verify.json` 参照。
- `youtube.test.ts` 単体: 32/32 pass（偽装ドメイン・ID長不正・非URL・空文字・URLでない行混在を含む）。

## 残リスク

- YouTube が新 URL 形式（例: `/live/<id>`）を追加した場合は抽出関数の追従が必要。未対応形式は null フォールバックで安全側（動画非表示・写真表示のまま）に倒れる。
- 既存 backlog P2 の「緩い CSP（unsafe-inline/unsafe-eval）」課題はスコープ外で残存。本変更はそれを悪化させない（frame-src の限定追加のみ）。

## 次の依頼や人判断

- なし。`/check-gates` が危険 eval（supabase_schema_change / auth_and_rls_policy / photo_upload_storage / csv_import_migration）を match させたが、これは**並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更が同じ作業ツリーに同居している**ことと語彙過剰マッチによるもの。本チケットの実変更は `web/src/lib/youtube.ts` / `web/src/__tests__/youtube.test.ts` / `web/next.config.ts` の3ファイルのみで、Supabase schema / auth・RLS / Storage / AI route / CSV移行には一切手を入れていない（manual-smokes.md / review.md に詳細）。
