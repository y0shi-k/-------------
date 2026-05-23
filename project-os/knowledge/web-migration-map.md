# Web Migration Map

## 目的

Canvas版 Stock Master を壊さず、同じリポジトリ内でWeb版を新設するための対応表。

## 方針

- 現行Canvas版は `app.html` を正本として維持する。
- Web版は `web/` にNext.jsアプリを新設する。
- Supabase定義は `supabase/` を正本にする。
- CSV移行などの補助処理は `scripts/` に置く。
- Canvas版とWeb版の変更は、原則として別ticketで扱う。
- Web版ticketは `TKT-0100` 以降を使う。

## 対応表

| Canvas版 | Web版 |
| --- | --- |
| `app.html` 単一ファイル | `web/` のNext.js + TypeScript |
| GAS `executeGAS()` | Next.js API Route |
| Google Spreadsheet | Supabase Postgres |
| Google Drive画像 | Supabase Storage |
| Gemini APIのCanvas補完 | サーバー側環境変数 `GEMINI_API_KEY` |
| 手動一括同期 | Web版のDB保存フローとして再設計 |
| Canvas verify | Web verify: lint / typecheck / test / build |

## セキュリティ境界

- Web版ではGAS、Google Spreadsheet、Google Driveを使わない。
- Gemini APIキーはブラウザへ出さない。
- Supabase service role keyをブラウザ側で使わない。
- 写真は個人情報を含む可能性があるため、公開バケットに保存しない。
- Supabase RLSを必須にする。RLSは本人のデータだけ読めるようにするDB側の安全設定。

## チケット分解

| 順番 | SPEC | TICKET | 目的 |
| --- | --- | --- | --- |
| 0 | `project-os/specs/SPEC-0100-web-migration-governance.md` | `project-os/tickets/TKT-0100-web-migration-governance.md` | AGENTS/ハーネス/テンプレートをWeb移植対応にする |
| 1 | `project-os/specs/SPEC-0101-web-project-bootstrap.md` | `project-os/tickets/TKT-0101-web-project-bootstrap.md` | `web/` にNext.js土台を作る |
| 2 | `project-os/specs/SPEC-0102-supabase-project-and-env.md` | `project-os/tickets/TKT-0102-supabase-project-and-env.md` | Supabase接続と環境変数管理を整える |
| 3 | `project-os/specs/SPEC-0103-supabase-schema-v1.md` | `project-os/tickets/TKT-0103-supabase-schema-v1.md` | Supabase schema v1を作る |
| 4 | `project-os/specs/SPEC-0104-auth-self-user.md` | `project-os/tickets/TKT-0104-auth-self-user.md` | 自分だけログインを作る |
| 5 | `project-os/specs/SPEC-0105-inventory-and-staging-web.md` | `project-os/tickets/TKT-0105-inventory-and-staging-web.md` | 在庫と登録待ちをWeb版へ移植する |
| 6 | `project-os/specs/SPEC-0106-mobile-photo-capture-upload.md` | `project-os/tickets/TKT-0106-mobile-photo-capture-upload.md` | スマホ/タブレット写真取り込みと圧縮アップロードを作る |
| 7 | `project-os/specs/SPEC-0107-ai-ingredient-scan-api.md` | `project-os/tickets/TKT-0107-ai-ingredient-scan-api.md` | サーバー側API経由のAI食材解析を作る |
| 8 | `project-os/specs/SPEC-0108-cooking-history-photo-web.md` | `project-os/tickets/TKT-0108-cooking-history-photo-web.md` | 料理履歴と完成写真をWeb版へ移植する |
| 9 | `project-os/specs/SPEC-0109-recipes-and-meal-schedule-web.md` | `project-os/tickets/TKT-0109-recipes-and-meal-schedule-web.md` | レシピ、献立、調理導線をWeb版へ移植する |
| 10 | `project-os/specs/SPEC-0110-csv-migration-tool.md` | `project-os/tickets/TKT-0110-csv-migration-tool.md` | Spreadsheet CSVをSupabaseへ移す |
| 11 | `project-os/specs/SPEC-0111-pwa-mobile-polish.md` | `project-os/tickets/TKT-0111-pwa-mobile-polish.md` | PWA化とスマホUI調整を行う |
| 12 | `project-os/specs/SPEC-0112-production-release-checklist.md` | `project-os/tickets/TKT-0112-production-release-checklist.md` | Vercel公開前チェックを行う |

## 再開方法

次に実装へ入る場合は `project-os/tickets/TKT-0101-web-project-bootstrap.md` を読む。
以後は各ticketの末尾にある「次」をたどる。
