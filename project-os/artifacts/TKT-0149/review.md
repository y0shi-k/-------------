---
ticket_id: TKT-0149
status: passed
review_scope:
  - supabase/config.toml
  - web/next.config.ts
  - docs/runbook/
  - project-os/artifacts/TKT-0149/
---

# TKT-0149 review

## checked_diff_paths

- `supabase/config.toml`
- `web/next.config.ts`
- `docs/runbook/公開前セキュリティ確認.md`
- `docs/runbook/Supabase登録の詳細手順.md`
- `project-os/artifacts/TKT-0149/verify.json`
- `project-os/artifacts/TKT-0149/manual-smokes.md`
- `project-os/artifacts/TKT-0149/review.md`
- `project-os/artifacts/TKT-0149/report.md`

## checked_artifacts

- `verify.json`: pass
- `manual-smokes.md`: pass
- `report.md`: ready

## findings

重大な未解決問題は見つからない。

確認したこと:

- `supabase/config.toml` で自由登録を閉じ、メール確認とパスワード基準を強化している。
- `web/next.config.ts` で基本的なブラウザ防御ヘッダーを追加している。
- CSPはSupabase通信、署名付き写真URL、ローカル開発を壊しにくい範囲にしている。
- APIキー、Supabase秘密鍵、DBパスワードの実値はコード・docs・artifactに書いていない。
- Canvas版 `app.html` は編集していない。

## open_risks

- `script-src` はNext.js開発環境を壊さないため、初回は `unsafe-inline` と `unsafe-eval` を許可している。将来、本番でnonce運用を入れる場合は別チケットで強化する。
- `img-src` は署名付き写真URLを壊さないため `https:` を許可している。画像取得先をより厳密に絞る場合は、本番ドメイン確定後に見直す。
- 本番Supabase Auth設定はDashboardで確認が必要。

## verdict

review_ready: pass
