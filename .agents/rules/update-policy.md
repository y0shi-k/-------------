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

## 軽量UI調整の更新単位
- 同一画面・同一目的の連続したUI調整は、新規 `SPEC-*` / `TKT-*` を毎回作らず、直近の関連 `SPEC-*` / `TKT-*` に集約する。
- 集約してよい例:
  - 余白、配置、横幅、折り返し、行数、hover、tooltip、表示件数、省略表示の調整
  - 同じカード・モーダル・一覧内の文言やCSSクラス修正
  - 保存形式を変えない描画関数の小さな修正
- 集約してはいけない例:
  - Spreadsheet列、GAS通信、`pendingSync`、保存JSON形式、データ移行の変更
  - 別画面へ影響する共通契約の変更
  - 削除・破壊的変更・ロールバック困難な変更
- artifact は小修正ごとにディレクトリを増やさず、対象 ticket の `project-os/artifacts/TKT-xxxx/` を最後に更新する。
- verify は一連の軽量調整が落ち着いたタイミングでまとめて実行する。途中で構文破損が疑わしい場合だけ、最小限の構文チェックを先に実行する。
