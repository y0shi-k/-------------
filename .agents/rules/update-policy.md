# Update Policy

## 同時更新の原則
- AI ハーネス運用ルール変更: `.agents/`
- 判定基準変更: `harness/*.json`
- 状態基盤テンプレ変更: `project-os/`
- 人向け運用変更: `docs/runbook/`
- 実装ログの明示依頼: `docs/temp/`
- 削除候補の退避先: `.trash/`

## 具体例
- 正本 / 生成物の境界変更:
  `AGENTS.md` と `.agents/rules/source-of-truth.md` を更新する
- eval 変更:
  `harness/change_evals.json` と関連する runbook を更新する
- phase gate 変更:
  `harness/phase_gates.json` と `.agents/rules/verify-and-gates.md` を更新する
- 実装ログ依頼:
  `docs/temp/` に新規ファイルを1件だけ作る
- ファイル廃止:
  まず `.trash/` に移し、必要なら退避理由を記録する
