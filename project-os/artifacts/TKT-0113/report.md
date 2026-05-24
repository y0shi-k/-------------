---
ticket: TKT-0113-canvas-parity-audit
status: ready
date: 2026-05-24
csv_migration_decision: stop
---

# Report

## 結論

TKT-0113の監査結果として、Web版はまだCanvas版完全一致ではない。`TKT-0110-csv-migration-tool` へは進めず、後続チケットで未移植差分を先に整理する。

## 更新内容

- `project-os/knowledge/canvas-parity-matrix.md` を更新した。
- Canvas版の主要領域を、Web版の実装済み/未実装/仕様差分に分類した。
- `missing`, `changed`, `partial` に後続チケットを付けた。
- CSV移行を止める判断を明記した。

## 主な未移植差分

- 保存場所管理
- 単位換算
- AIレシピ考案
- レシピ本文AI構造化
- 7日献立、日送り、ドラッグ移動、削除
- 作りたい候補
- 今日ダッシュボード
- 調理ビューア
- 調理完了時の在庫減算、消費量調整、代替品選択
- 料理履歴のカレンダー、分析、検索、フィルタ
- Canvas同等の下部ナビとスマホ導線

## CSV移行判定

判定: `止める`

理由:

- 単位換算と調理完了時の在庫消費は、CSV移行項目とSupabase schemaに影響する。
- 保存場所管理と作りたい候補は、保存形式が未確定。
- AIレシピ考案とレシピ本文構造化は、レシピ保存形式に追加項目が必要になる可能性がある。
- 先にCSV移行を作ると、後続実装後に移行ロジックを作り直すリスクが高い。

## 次の推奨順

1. `TKT-0114-web-canvas-mode-navigation`
2. `TKT-0115-inventory-staging-canvas-parity`
3. `TKT-0116-storage-location-management-web`
4. `TKT-0117-unit-conversion-web`
5. `TKT-0118` から `TKT-0127` の完全一致チケット群
6. その後に `TKT-0110-csv-migration-tool` を再判断する
