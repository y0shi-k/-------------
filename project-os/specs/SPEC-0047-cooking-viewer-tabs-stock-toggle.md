---
id: SPEC-0047-cooking-viewer-tabs-stock-toggle
title: 料理ビューアーの在庫チェック切替とカテゴリタブ追加
status: ready
scope:
  - 料理ビューア（cookingViewer）
constraints:
  - スプレッドシート列は追加・削除しない
  - GAS通信、pendingSync、料理完了、在庫消費調整のデータ更新フローは変更しない
  - 初期読込/承認を除く書き込み系は `state.pendingSync` + `syncPendingChanges()` に集約し、個別 `executeGAS(payload...)` を増やさない
acceptance:
  - 料理ビューア左ペインにALL/材料/調味料タブが表示され、全件1列表示とカテゴリ別表示を切り替えられる
  - 料理ビューア右ペインにALL/下ごしらえ/調理工程タブが表示され、全手順1列表示とカテゴリ別表示を切り替えられる
  - 在庫チェックトグルは料理ビューアを開くたびにOFFで開始する
  - 在庫チェックOFFでは材料・調味料行が1行のコンパクト表示になる
  - 在庫チェックONでは現状同等の在庫あり/不足と在庫数量・必要数量を含む2行表示になる
  - 空カテゴリは無効表示または空メッセージになり、既存レシピの後方互換表示が維持される
related_tickets:
  - TKT-0047-cooking-viewer-tabs-stock-toggle
---

# Summary

料理中の一覧性を上げるため、材料ペインに在庫チェックON/OFFを追加し、OFF時は1行表示にする。既存の材料・手順2ペインは維持し、それぞれのペイン内にカテゴリタブを追加する。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- 在庫チェック状態とカテゴリタブ状態はクライアントUI状態のみで、Spreadsheetへ保存しない

## 非対象

- Spreadsheetスキーマ変更
- GAS通信方式変更
- `pendingSync` 構造変更
- 料理完了時の在庫消費量調整ロジック変更

## Acceptance Example

- 料理ビューアを開くと、在庫チェックOFFでALLタブが1行表示される
- 在庫チェックをONにすると、同じ材料タブが在庫あり/不足付きの2行表示に変わる
- ALL/材料/調味料、ALL/下ごしらえ/調理工程をタブで切り替えられる
