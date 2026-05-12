# Source of Truth

## 正本
- プロジェクト名: `{{PROJECT_NAME}}`
- 正本: `{{SOURCE_OF_TRUTH_PATHS}}`
- verify: `{{VERIFY_COMMAND}}`
- 任意監査: `{{OPTIONAL_AUDIT_COMMAND}}`
- build / syntax / manual smoke 基準: `harness/registry.json`
- 変更観点の正本: `harness/change_evals.json`
- phase gate の正本: `harness/phase_gates.json`

## 生成物
- `{{GENERATED_FILES}}` は生成物として扱う
- 生成物だけを直接編集しない
- 正本を変更したら、必ず verify を通す

## 状態の正本
- 会話ログではなく `project-os/` を次の行動の正本とする
- 変更目的と acceptance は `project-os/specs/` と `project-os/tickets/` に残す
- verify、audit、review、report は `project-os/artifacts/` に残す
