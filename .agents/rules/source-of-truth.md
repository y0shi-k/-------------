# Source of Truth

## 正本
- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/`
- Web版正本（現役）: `web/`, `supabase/`, `scripts/`
- Canvas版（凍結・参照専用）: `app.html`, `要件定義書.md` … 編集しない参照資産
- verify の正本: `harness/registry.json` と `harness/bin/verify_web.sh`（`/verify`）。コマンドは他所に直書きしない。
- 任意監査: 現時点では未定（Phase2以降で必要に応じて設定）
- build / syntax / manual smoke 基準: `harness/registry.json`
- 変更観点の正本: `harness/change_evals.json`（active = Web、reference = Canvas）
- phase gate の正本: `harness/phase_gates.json`

## 生成物
- GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像は生成物として扱う
- Vercelデプロイ、Supabase本番DB、Supabase Storage画像は生成物として扱う
- 生成物だけを直接編集しない
- 正本を変更したら、必ず verify を通す

## 境界
- Canvas版 `app.html` は凍結・参照専用。編集対象は Web版のみ。
- Web版ではGAS、Google Spreadsheet、Google Driveを使わない。
- Web版のAPIキー、Supabase秘密鍵、DB接続情報、写真URLは正本に実値を書かない。

## 状態の正本
- 会話ログではなく `project-os/` を次の行動の正本とする
- 変更目的と acceptance は `project-os/specs/` と `project-os/tickets/` に残す
- verify、audit、review、report は `project-os/artifacts/` に残す
