---
ticket_id: TKT-0100-web-migration-governance
status: ready
---

# 変更目的

Canvas版を壊さず、同じリポジトリ内でWeb版移植を始められるように、AGENTS/ハーネス/project-osの運用ルールを分離した。

# これまで不足していた点

既存ルールは `app.html`、GAS、Google Spreadsheet、Google Driveを前提にしていた。Next.js + Supabase + Vercelで作るWeb版には、そのまま使えないverifyや安全条件が混ざっていた。

# 今回追加した安全装置

- Canvas版とWeb版の正本を分けた。
- Web版ではGAS、Google Spreadsheet、Google Driveを使わないことを明記した。
- APIキー、Supabase秘密鍵、写真URLを直書きしないルールを追加した。
- Supabase RLS、ログイン保護、Storage非公開をWeb版の停止条件に追加した。
- Web版用のevalとmanual smoke項目を追加した。

# 実施した確認

- `harness/registry.json` のJSON構文確認
- `harness/change_evals.json` のJSON構文確認
- `app.html` のHTML構文確認
- `executeGAS` と `GAS_URL` の存在確認

# 残リスク

- `web/` はまだ作成していないため、Web版の `npm run lint` / `typecheck` / `test` / `build` は未実行。
- Supabase、Vercel、CSV移行は後続ticketで扱う。

# 次の依頼や人判断

次は `TKT-0101-web-project-bootstrap` として、`web/` にNext.js土台を作る段階に進める。
