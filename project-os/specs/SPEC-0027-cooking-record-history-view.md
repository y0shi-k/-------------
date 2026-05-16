---
id: SPEC-0027-cooking-record-history-view
title: 料理・記録画面のレシピ確認と料理履歴タブ化
status: spec_ready
scope:
  - モードC（料理・記録）の通常表示
  - 料理履歴シートの読み取り表示
  - 初期同期と手動一括同期後のフロント状態更新
constraints:
  - 既存スキーマは変更しない
  - スプレッドシート書き込みは追加しない
  - 書き込み系処理は既存の `state.pendingSync` + `syncPendingChanges()` に限定する
  - Drive画像配信や共有設定変更は行わない
acceptance:
  - モードC通常表示が「レシピ確認」「料理履歴」の2タブで切り替えられる
  - レシピ確認タブから今日の献立、次の未完了献立、レシピ集のレシピを選んで `openCookingViewer(recipeId)` に入れる
  - 初期同期で `料理履歴` シートが読み込まれ、`state.cookingHistory` に保持される
  - `syncPendingChanges()` 成功後に返却された最新の `料理履歴` で `state.cookingHistory` が更新される
  - 料理履歴タブに調理日、レシピ名、星評価、感想抜粋、写真サムネイルまたはフォールバックリンクが表示される
  - レシピ名検索、評価、写真あり/なしで履歴を絞り込める
  - 新規の個別 `executeGAS(payload...)` 書き込み通信を追加しない
related_tickets:
  - TKT-0027-cooking-record-history-view
---

# Summary

モードCを料理中の大画面ビューアへ直接入るだけの画面から、料理前のレシピ確認と料理後の履歴確認を往復できる画面に拡張する。

## 背景

料理完了時の履歴追加は既に `pendingSync.cookingHistory` と `syncPendingChanges()` に統合されている。一方で、保存済みの `料理履歴` シートをユーザーが確認する画面がないため、モードCに履歴表示を追加する。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- スプシ変更ポリシー: 初期読込/承認を除く書き込み系は `state.pendingSync` + `syncPendingChanges()` に集約し、個別 `executeGAS(payload...)` を増やさない

### データ

`料理履歴` シートは既存列をそのまま読み取り、フロントでは以下の形で保持する。

- `id`
- `cookingDate`
- `recipeId`
- `recipeName`
- `comment`
- `photoUrl`
- `rating`
- `lastEdited`

### 写真表示

- `photoUrl` がある場合はまず `<img>` のサムネイル表示を試す
- 読み込みに失敗した場合はサムネイルを非表示にし、「写真を開く」リンクを表示する
- `photoUrl` がない場合はプレースホルダーを表示する

## 非対象

- `料理履歴` シートの列追加、列変更、削除
- GAS経由の画像プロキシ配信
- Drive共有設定の自動変更
- 履歴の編集、削除、再同期

## Acceptance Example

- `project-os/artifacts/TKT-0027/` の verify、manual smoke、review、report で達成可否を判定できる。
