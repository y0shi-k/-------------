# TKT-0033-schedule-multi-drag-select.md

---
ticket_id: TKT-0033
related_specs:
  - SPEC-0033-schedule-multi-drag-select.md
owner_role: ai-implementer
required_evals:
  - ui_component_addition
  - gas_schema_change
  - state_structure_change
status: implementation_ready
---

## 目的

献立スケジュール機能を以下3点で拡張する。

1. **複数レシピ配置**: 1日の朝・昼・晩の各ブロックに複数レシピを配置できるようにする。
2. **D&D移動**: 配置済みレシピをドラッグ＆ドロップで別日・別食事ブロックへ移動、または同ブロック内で並び替えできるようにする。
3. **選択モード＋一括削除**: 選択モードでチェックしたレシピカードを一括削除できるようにする。完了済みが含まれる場合は確認モーダルを表示する。

## タスク

### GAS側（スプレッドシート）
- [ ] `献立スケジュール` シートのヘッダーを8列化: `ID, 予定日, 食事区分, レシピID, レシピ名, ステータス, 表示順, 最終編集日時`
- [ ] `handleInit` のGASペイロードに既存6列データの自動移行処理を追加（ID付与、sortOrder=0）
- [ ] `readSchedule` を8列読み込み・sortOrderソート対応に更新
- [ ] 一括同期GASコードの献立部分をIDベースに更新（deleteはidベース、create/updateもid対応）
- [ ] `loadSchedule` の週指定読み込みも8列対応に更新

### クライアント側（State & Sync）
- [ ] `state.schedule` の各アイテムに `id`（`sched_` prefix UUID）と `sortOrder` を追加
- [ ] `state.scheduleSelectMode`（boolean）と `state.scheduleSelectedIds`（Set相当の配列）を追加
- [ ] `cleanScheduleItem` を8列構造対応に更新
- [ ] `queueScheduleCreate` / `queueScheduleDelete` / `queueScheduleUpdate` をIDベースに更新
- [ ] `syncPendingChanges` の献立部分を新構造に合わせて更新
- [ ] `state.syncedSnapshot.schedule` の clone 対応

### UIレンダリング
- [ ] `renderSchedule`: 各食事ブロックを `flex-col` に変更。複数レシピを縮小カードで縦積み表示
- [ ] 各レシピカードにドラッグハンドル（`≡`）を追加。カード本体タップは献立開始を維持
- [ ] 空ブロックは「＋追加」ボタンを最下部に配置
- [ ] `renderRecipeModeControls`（scheduleタブ時）に「選択モード」トグルボタンを追加
- [ ] 選択モードON時、各レシピカードにチェックボックス（`schedule-cb`）を表示
- [ ] 1件以上選択時に「チェックした献立を一括削除」ボタンを表示

### D&D機能
- [ ] `dragstart`: ドラッグ中のIDをdataTransferに設定、ドラッグスタイル（`opacity-50`）を付与
- [ ] `dragover`: 各食事ブロックをドロップゾーン化、`drag-over` クラス付与
- [ ] `drop`: 同ブロック内→sortOrder再計算（0.5挿入→後で整数化）。別ブロック→date/meal変更、sortOrder=max+1
- [ ] D&D後は `state.pendingSync` に即反映、`updateSyncBar()` 呼び出し（個別GAS通信禁止）

### 一括削除＋確認モーダル
- [ ] 「完了済みが含まれるか」を判定
- [ ] 完了済みあり→確認モーダル表示（タイトル＋メッセージ＋キャンセル/削除ボタン）。`alert`/`confirm` 不使用
- [ ] 未完了のみ→即削除
- [ ] 削除後、選択モード解除、再描画

### Verify
- [ ] `python3 -c "import html.parser..."` でHTML構文チェック
- [ ] `grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html`
- [ ] `showToast` 関数存在確認
- [ ] スプシ書き込みが `syncPendingChanges()` 経由であることを確認
- [ ] `alert(` / `confirm(` / `prompt(` が残存していないか確認

## Acceptance

- 献立スケジュールの各食事ブロックに複数レシピを配置できる
- 同ブロック内でレシピカードをD&Dで並び替えでき、順序は同期後も保持される
- 別日・別食事ブロックへD&Dでレシピを移動できる
- 選択モードで複数レシピにチェックを入れ、一括削除できる
- 一括削除に完了済み献立が含まれる場合、確認モーダルが表示される
- `alert`/`confirm`/`prompt` は使用されていない
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
- `project-os/artifacts/TKT-0033/` にレポート・レビュー・手動スモークテスト・verify結果が作成されている
