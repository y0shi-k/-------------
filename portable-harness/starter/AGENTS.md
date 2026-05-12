# AGENTS.md

- 回答は、非エンジニア向けに丁寧に省略しないでください。
- 余計な修飾語を使わないでください。

- このファイルは、このリポジトリで作業する AI 向けの入口です。
- 詳細は `.agents/` と `project-os/`、人向け文書は `docs/` を参照してください。

## 最優先ルール
- 既存機能を壊さない
- 正本と生成物の境界を守る
- 実装前に関連する `project-os/tickets/TKT-*` が存在し `implementation_ready` であることを確認する
- `spec_ready` と `implementation_ready` が揃うまで実装へ入らない
- 変更後は `{{VERIFY_COMMAND}}` を実行する
- 完了判定は `spec + ticket + artifacts + phase_gates` で行う

## 開始前ゲート
- `非 trivial` な変更は、実装前に `project-os/specs/SPEC-*` と `project-os/tickets/TKT-*` を作成または既存選択する
- `非 trivial` とは、repo-tracked な変更、挙動変更、検証付き修正、review を要する変更を指す
- `spec_ready` と `implementation_ready` が揃っていない場合、AI は実装ではなく `spec/ticket` 整備を先に行う
- 読み取り専用の調査、単純質問、既存文書の要約はこのゲートの対象外
- 完了報告は会話だけで閉じず、`project-os/artifacts/TKT-xxxx/` に必要 artifact を残してから行う

## 正本ファイル
- プロジェクト名: `{{PROJECT_NAME}}`
- 正本: `{{SOURCE_OF_TRUTH_PATHS}}`
- 生成物: `{{GENERATED_FILES}}`
- verify: `{{VERIFY_COMMAND}}`
- 任意監査: `{{OPTIONAL_AUDIT_COMMAND}}`
- ハーネス設定: `harness/registry.json`
- eval 設定: `harness/change_evals.json`
- phase gate 定義: `harness/phase_gates.json`

## まず見る文書
- AI ハーネス入口: `.agents/index.md`
- 状態基盤の入口: `project-os/index.md`
- 人向け文書の目次: `docs/index.md`
- 人向け導入手順: `docs/runbook/導入手順.md`

## 安全ルール
- `{{SENSITIVE_DATA_RULES}}`
- `{{DEPLOYMENT_BOUNDARY}}`
- 破壊的操作、デプロイ、本番変更は明示依頼がある場合だけ実行する
- 不要ファイルを `rm` で即削除しない。削除候補はまず `.trash/` へ退避する

## 更新ルール
- AI ハーネス運用ルール変更時は `.agents/` も更新する
- 判定基準変更時は `harness/*.json` と必要な `project-os/` 記録も更新する
- 人向け運用ルール変更時は `docs/runbook/導入手順.md` も更新する
- `docs/temp/` の変更メモは、ユーザーが明示的に依頼した場合のみ新規作成する
- `docs/temp/` は追記ではなく、毎回新規ファイルを作る
