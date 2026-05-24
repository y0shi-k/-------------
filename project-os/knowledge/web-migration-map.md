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
- Web版は「スプシ/GAS/Drive連携以外はCanvas版と同じ」を目標にする。主要ワークフローだけのMVPでは完了扱いにしない。
- CSV移行へ進む前に `TKT-0113-canvas-parity-audit` を必ず実施し、完全一致チケット群 `TKT-0114` から `TKT-0127` を先に進める。

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
| 10 | `project-os/specs/SPEC-0113-canvas-parity-audit.md` | `project-os/tickets/TKT-0113-canvas-parity-audit.md` | Canvas版完全一致監査。CSV移行前の必須ゲート |
| 11 | `project-os/specs/SPEC-0114-web-canvas-mode-navigation.md` | `project-os/tickets/TKT-0114-web-canvas-mode-navigation.md` | Canvas同等の主モードナビとステータス表示 |
| 12 | `project-os/specs/SPEC-0115-inventory-staging-canvas-parity.md` | `project-os/tickets/TKT-0115-inventory-staging-canvas-parity.md` | 在庫・登録待ちのCanvas同等化 |
| 13 | `project-os/specs/SPEC-0116-storage-location-management-web.md` | `project-os/tickets/TKT-0116-storage-location-management-web.md` | 保存場所管理をWeb版へ移植 |
| 14 | `project-os/specs/SPEC-0117-unit-conversion-web.md` | `project-os/tickets/TKT-0117-unit-conversion-web.md` | 単位換算をWeb版へ移植 |
| 15 | `project-os/specs/SPEC-0118-shopping-list-canvas-parity.md` | `project-os/tickets/TKT-0118-shopping-list-canvas-parity.md` | 買い物リストのCanvas同等化 |
| 16 | `project-os/specs/SPEC-0119-recipe-collection-canvas-parity.md` | `project-os/tickets/TKT-0119-recipe-collection-canvas-parity.md` | レシピ集のCanvas同等化 |
| 17 | `project-os/specs/SPEC-0120-ai-recipe-generation-web.md` | `project-os/tickets/TKT-0120-ai-recipe-generation-web.md` | AIレシピ考案と本文構造化をWeb版へ移植 |
| 18 | `project-os/specs/SPEC-0121-meal-schedule-canvas-parity.md` | `project-os/tickets/TKT-0121-meal-schedule-canvas-parity.md` | 献立のCanvas同等化 |
| 19 | `project-os/specs/SPEC-0122-cook-candidate-queue-web.md` | `project-os/tickets/TKT-0122-cook-candidate-queue-web.md` | 作りたい候補をWeb版へ移植 |
| 20 | `project-os/specs/SPEC-0123-today-dashboard-web.md` | `project-os/tickets/TKT-0123-today-dashboard-web.md` | 今日ダッシュボードをWeb版へ移植 |
| 21 | `project-os/specs/SPEC-0124-cooking-viewer-web.md` | `project-os/tickets/TKT-0124-cooking-viewer-web.md` | 調理ビューアをWeb版へ移植 |
| 22 | `project-os/specs/SPEC-0125-cooking-completion-consumption-web.md` | `project-os/tickets/TKT-0125-cooking-completion-consumption-web.md` | 調理完了と在庫消費をWeb版へ移植 |
| 23 | `project-os/specs/SPEC-0126-cooking-history-analysis-web.md` | `project-os/tickets/TKT-0126-cooking-history-analysis-web.md` | 料理履歴分析をWeb版へ移植 |
| 24 | `project-os/specs/SPEC-0127-delete-confirmation-web.md` | `project-os/tickets/TKT-0127-delete-confirmation-web.md` | 削除確認をWeb版で統一 |
| 25 | `project-os/specs/SPEC-0110-csv-migration-tool.md` | `project-os/tickets/TKT-0110-csv-migration-tool.md` | Spreadsheet CSVをSupabaseへ移す |
| 26 | `project-os/specs/SPEC-0111-pwa-mobile-polish.md` | `project-os/tickets/TKT-0111-pwa-mobile-polish.md` | PWA化とスマホUI調整を行う |
| 27 | `project-os/specs/SPEC-0112-production-release-checklist.md` | `project-os/tickets/TKT-0112-production-release-checklist.md` | Vercel公開前チェックを行う |

## 再開方法

次に実装へ入る場合は `project-os/tickets/TKT-0101-web-project-bootstrap.md` を読む。
以後は各ticketの末尾にある「次」をたどる。

## 現在の停止条件

`TKT-0109` 完了後は `TKT-0110-csv-migration-tool` へ直行しない。
先に `TKT-0113-canvas-parity-audit` を実施し、完全一致チケット群 `TKT-0114` から `TKT-0127` を進める。特に保存場所、単位換算、作りたい候補、調理完了/在庫消費はCSV移行前に必須。
