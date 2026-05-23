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

- `TKT-0100`: AGENTS/ハーネス/テンプレートをWeb移植対応にする
- `TKT-0101`: `web/` にNext.js土台を作る
- `TKT-0102`: Supabase接続と環境変数管理を整える
- `TKT-0103`: Supabase schema v1を作る
- `TKT-0104`: 自分だけログインを作る
- `TKT-0105`: 在庫と登録待ちをWeb版へ移植する
- `TKT-0106`: スマホ/タブレット写真取り込みと圧縮アップロードを作る
- `TKT-0107`: サーバー側API経由のAI食材解析を作る
- `TKT-0108`: 料理履歴と完成写真をWeb版へ移植する
- `TKT-0109`: レシピ、献立、調理導線をWeb版へ移植する
- `TKT-0110`: Spreadsheet CSVをSupabaseへ移す
- `TKT-0111`: PWA化とスマホUI調整を行う
- `TKT-0112`: Vercel公開前チェックを行う
