# Source of Truth

## 正本
- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`, `.agents/`, `harness/*.json`
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- 任意監査: 現時点では未定（Phase2以降で必要に応じて設定）
- build / syntax / manual smoke 基準: `harness/registry.json`
- 変更観点の正本: `harness/change_evals.json`
- phase gate の正本: `harness/phase_gates.json`

## 生成物
- GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像は生成物として扱う
- 生成物だけを直接編集しない
- 正本を変更したら、必ず verify を通す

## 状態の正本
- 会話ログではなく `project-os/` を次の行動の正本とする
- 変更目的と acceptance は `project-os/specs/` と `project-os/tickets/` に残す
- verify、audit、review、report は `project-os/artifacts/` に残す
