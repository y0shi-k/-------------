# 初回指示文

次のプロジェクトでは、このリポジトリにある AI ハーネス一式を前提に進めてください。

## 最初に守ること

1. 入口は `AGENTS.md` とし、そこから `.agents/` `project-os/` `harness/` `docs/` を参照してください。
2. 実装前に、対象 `project-os/specs/SPEC-*` と `project-os/tickets/TKT-*` を確認してください。
3. `spec_ready` と `implementation_ready` が揃うまでは実装を始めないでください。
4. 正本ファイルだけを編集し、生成物だけを直接直さないでください。
5. 変更後は `{{VERIFY_COMMAND}}` を実行し、結果を `project-os/artifacts/TKT-xxxx/` に残してください。
6. 監査が必要な変更だけ `{{OPTIONAL_AUDIT_COMMAND}}` を実行してください。
7. 完了判定は会話ではなく、`spec + ticket + artifacts + phase_gates` で行ってください。

## このハーネスで期待する進め方

- 小さな変更でも、変更理由と acceptance は `project-os/` に残してください。
- AI向けルールは `.agents/`、人向け説明は `docs/` に分けてください。
- `harness/*.json` は機械可読な判定基準として扱ってください。
- 不要そうなファイルをすぐ削除せず、まず `.trash/` に退避してください。

## 案件固有で埋める項目

次のプレースホルダが残っている場合は、その案件の実態に合わせて先に埋めてください。

- `{{PROJECT_NAME}}`
- `{{SOURCE_OF_TRUTH_PATHS}}`
- `{{GENERATED_FILES}}`
- `{{VERIFY_COMMAND}}`
- `{{OPTIONAL_AUDIT_COMMAND}}`
- `{{SENSITIVE_DATA_RULES}}`
- `{{STACK_SPECIFIC_EVALS}}`
- `{{MANUAL_SMOKE_ITEMS}}`
- `{{DEPLOYMENT_BOUNDARY}}`

## 実装開始前の短い確認

- 今回の正本はどこか
- 生成物は何か
- verify は何を実行するか
- artifacts はどこへ残すか
- 完了条件はどの gate か

これが曖昧なまま実装へ進まないでください。
