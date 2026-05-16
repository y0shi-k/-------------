# TKT-0032 Review

## 変更概要

食材管理画面の保存場所選択タブに、各場所の在庫件数をバッジで表示する機能を追加。

## 変更箇所

### app.html
- `renderInventoryPrimaryRow()` の拡張
  - `allCount` / `allBadgeClass` の算出
  - `storageTabs` 生成時に `state.inventory.filter(item => item.loc === loc).length` で件数を計算
  - 各ボタン内に `<span class="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${badgeClass}">${count}</span>` を挿入

## コード品質評価

| 観点 | 評価 | コメント |
|------|------|----------|
| 可読性 | Good | 既存パターンに沿った最小限の変更 |
| パフォーマンス | Good | O(N*M) だが保存場所数・在庫数ともに小規模で実用上問題なし |
| 保守性 | Good | `renderInventoryPrimaryRow()` 内で完結、外部依存なし |
| 既存機能への影響 | None | `getLocationTabClass()` は変更せず、既存ロジックを壊さない |

## 懸念事項

- 将来的に在庫数が数百件を超える場合、`filter()` の毎回全走査が気になる可能性あり
  - 現状では `renderModeControls()` の呼び出し頻度も低く、実用上問題なし

## Review结论

**APPROVED** — 軽微なUI改善でリスクは極めて低い。実装方針に問題なし。
