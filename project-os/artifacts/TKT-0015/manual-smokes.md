---
ticket_id: TKT-0015-custom-storage-locations
status: passed
execution_mode: static_only
target_evals:
  - standard_verify
  - manual_bulk_sync_policy
  - ui_smoke
---

# Manual Smokes

## target_evals

- 保存場所タブの動的描画
- 保存場所管理モーダルの名前変更・統合・削除
- 食材追加/編集モーダルからの保存場所追加
- 手動一括同期ポリシー

## executed_checks

- `#locationTabs` が固定タブではなく `renderLocationTabs()` で描画されることを確認。
- 保存場所チップが `flex-wrap` で折り返され、場所数が増えても右端で見切れないことを静的確認。
- タイトル、保存場所チップ、並び替え、すべて選択、買い物表示コントロールが `#inventoryStickyHeader` 内に入り、スクロール時に上部固定されることを静的確認。
- 保存場所候補が既定値、`state.customLocations`、`state.inventory[].loc`、`state.staging[].loc` から作られることを確認。
- 食材モーダルの `#f-loc` が `renderLocationOptions()` により同じ候補を使い、「新しい保存場所を追加」を選べることを確認。
- 名前変更・統合が `applyLocationChange()` を通り、在庫は `queueInventoryUpdate()` に積まれることを確認。
- 登録待ちの保存場所変更はメモリ上の `state.staging` のみを更新することを確認。
- `alert` / `confirm` / `prompt` が残っていないことを確認。
- 個別書き込み用の `executeGAS(payload...)` が増えていないことを確認。

## skipped_checks

- Gemini Canvas 実機でのタップ操作とSpreadsheet同期確認は未実施。

## open_risks

- 未使用の保存場所候補はセッション内保持のため、リロード後は食材に割り当て済みの保存場所だけが復元される。
