# adapter-guide

## 目的

この文書は、`portable-harness/starter/` を別の技術スタックへ持ち込むときに、何を差し替えるかを一覧で示すためのものです。

## 差し替え対象一覧

| 項目 | 何を入れるか | 入れる場所 |
| --- | --- | --- |
| `{{PROJECT_NAME}}` | プロジェクト名 | `AGENTS.md` `docs/` |
| `{{SOURCE_OF_TRUTH_PATHS}}` | 正本ファイルや正本ディレクトリ | `AGENTS.md` `.agents/rules/source-of-truth.md` |
| `{{GENERATED_FILES}}` | 生成物や build 出力 | `AGENTS.md` `.agents/rules/source-of-truth.md` |
| `{{VERIFY_COMMAND}}` | 変更後に必ず実行する verify コマンド | `AGENTS.md` `.agents/index.md` `.agents/rules/verify-and-gates.md` |
| `{{OPTIONAL_AUDIT_COMMAND}}` | 監査ログや本番イベント分析が必要な時だけ使うコマンド | `AGENTS.md` `.agents/rules/verify-and-gates.md` |
| `{{SENSITIVE_DATA_RULES}}` | 外部へ出してはいけないデータ例 | `AGENTS.md` `.agents/rules/data-safety.md` |
| `{{STACK_SPECIFIC_EVALS}}` | 機能ごとの eval 名と対象 | `harness/change_evals.json` |
| `{{MANUAL_SMOKE_ITEMS}}` | 人が見るべき手動確認項目 | `harness/registry.json` `docs/runbook/導入手順.md` |
| `{{DEPLOYMENT_BOUNDARY}}` | AI が勝手に越えてはいけない境界 | `AGENTS.md` `.agents/rules/data-safety.md` |

## 技術スタック別の見直し観点

### Web フロント + API

- 正本: `src/` `app/` `server/`
- 生成物: `dist/` `build/` 生成 HTML
- verify: build、lint、test、snapshot、schema check

### モバイルアプリ

- 正本: `app/` `android/` `ios/`
- 生成物: 生成アセット、ビルド成果物
- verify: unit test、UI snapshot、型チェック、署名前確認

### バックエンド / バッチ

- 正本: `src/` `services/` `jobs/`
- 生成物: generated client、migration artifact、compiled output
- verify: unit test、integration test、migration dry-run、schema check

### データ処理 / 分析

- 正本: `pipelines/` `sql/` `notebooks/` `models/`
- 生成物: export、cache、compiled SQL、report artifact
- verify: dry-run、schema validation、sample dataset check、artifact diff

## 変更しない共通コア

- 実装前に `spec` と `ticket` を整える
- 正本と生成物を分ける
- verify / gate / artifact で完了判定する
- AI向けルールと人向け説明を分ける
- 不要ファイルはすぐ削除せず `.trash/` に退避する

## 変更する順番

1. `AGENTS.md`
2. `.agents/rules/source-of-truth.md`
3. `.agents/rules/verify-and-gates.md`
4. `.agents/rules/data-safety.md`
5. `harness/registry.json`
6. `harness/change_evals.json`
7. 必要なら `docs/runbook/導入手順.md`

## 導入後の最低確認

- `AGENTS.md` に具体パスが入った
- `{{VERIFY_COMMAND}}` が実行可能
- `harness/change_evals.json` に実案件の eval が入った
- `project-os/specs/` と `tickets/` に最初の `SPEC/TKT` がある
- `project-os/artifacts/TKT-xxxx/` に verify を残せる
