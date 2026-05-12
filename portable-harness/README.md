# portable-harness

## 目的

このディレクトリは、このリポジトリで使っている AI ハーネス設計を、別のプロジェクトでも使える形へ切り出した再利用パッケージです。

対象は次の状況です。

- 新しいプロジェクトを AI 主導で始めたい
- 技術スタックが違っても、入口、verify、gate、artifact の型は揃えたい
- 「このハーネスで進めて」と AI に渡せる一式を最初から置きたい

## この一式に含めたもの

- `bootstrap-prompt.md`
  - 次案件の AI に最初に渡す指示文
- `adapter-guide.md`
  - 何を共通で使い、何を案件ごとに差し替えるかの一覧
- `examples/current-project-mapping.md`
  - この案件での固有ルールを、汎用ハーネスではどう外したかの対応表
- `starter/`
  - 新規プロジェクトへそのままコピーする雛形一式

## そのまま使うもの

- `starter/AGENTS.md`
- `starter/.agents/`
- `starter/project-os/`
- `starter/harness/`
- `starter/docs/`
- `starter/.trash/`

## 差し替えるもの

次の項目は案件ごとに必ず差し替えてください。

- `{{PROJECT_NAME}}`
- `{{SOURCE_OF_TRUTH_PATHS}}`
- `{{GENERATED_FILES}}`
- `{{VERIFY_COMMAND}}`
- `{{OPTIONAL_AUDIT_COMMAND}}`
- `{{SENSITIVE_DATA_RULES}}`
- `{{STACK_SPECIFIC_EVALS}}`
- `{{MANUAL_SMOKE_ITEMS}}`
- `{{DEPLOYMENT_BOUNDARY}}`

差し替えの意味は `adapter-guide.md` にまとめています。

## 導入手順

1. `portable-harness/starter/` を新規プロジェクトのルートへコピーします。
2. `bootstrap-prompt.md` を次案件の AI へ最初に渡します。
3. `AGENTS.md` と `.agents/rules/*` のプレースホルダを埋めます。
4. `harness/*.json` の verify 対象、eval、manual smoke、gate 条件を案件用に差し替えます。
5. `project-os/specs/` と `project-os/tickets/` に最初の `SPEC/TKT` を作ってから実装を開始します。

## 使い方の原則

- AI の入口は必ず `AGENTS.md`
- 実装前に `spec` と `ticket` を整える
- 正本と生成物を分ける
- verify と gate で完了判定する
- 会話ではなく `project-os/` に状態を残す

## 注意

- `starter/` は雛形です。案件固有の build / verify スクリプト本体は含みません。
- そのため、`{{VERIFY_COMMAND}}` と `harness/*.json` を埋めずにそのまま使う前提ではありません。
- この案件固有の例は `examples/current-project-mapping.md` にだけ置いています。starter 本文へ戻さないでください。
