---
ticket_id: TKT-0001
status: passed
review_scope: UIコンポーネント追加 + GAS通信パターン拡張
---

# Review Record (TKT-0001)

## checked_diff_paths
- `app.html`（全変更集中）

## checked_artifacts
- `verify_summary.md`（VERIFY_PASSED 確認済み）
- `manual-smokes.md`（4/6チェック実行済み）

## findings
- **UIコンポーネント**: 既存のカード/バッジ/ボタンクラス構成を踏襲している
  - バッジ: `text-[9px] font-black px-1.5 py-0.5 rounded-full`
  - 行: `bg-white p-3 rounded-xl shadow-sm border`
  - ボタン: `active:scale-90 transition-all`
- **GASパターン**: `executeGAS()` を改変せず、内部のペイロード文字列のみ拡張
- **スキーマ**: `appendRow` / `setValue` のカラム順序が要件定義書と厳密に一致（A=ID, B=分類, C=品名, ... K=状態メモ）
- **アクセシビリティ**: `setStatus` 内の `disabled` 制御が新規ボタン（±, ✎, 🗑）にも自動適用される

## open_risks
- `updateInventoryItem` / `deleteInventoryItem` / `adjustInventoryQty` は実際のGASエンドポイント未検証
- `renderList` 内で `new Date(item.limit2)` を実行するが、無効な日付文字列の場合 `Invalid Date` になり `diff` が `NaN` になる可能性 → 現状では `item.limit2` が存在する場合のみ分岐に入るが、空文字の場合は `new Date('')` は `Invalid Date` になる。ただしスプレッドシートから読み込まれた空セルは `f()` で `''` に変換され、条件 `if (item.limit2)` で弾かれる。

## verdict
**PASSED** — スキーマ変更なし、GAS通信パターン維持、UI一貫性あり。実装を承認する。
