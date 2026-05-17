# Review — TKT-0058-consumption-substitution-tabs

## Review対象

- SPEC: `project-os/specs/SPEC-0058-consumption-substitution-tabs.md`
- TICKET: `project-os/tickets/TKT-0058-consumption-substitution-tabs.md`
- 変更ファイル: `app.html`
- Artifacts: `project-os/artifacts/TKT-0058/`

## 観点別チェック

### 仕様との整合性

| # | 項目 | 結果 |
|---|---|---|
| 1 | All/調味料/材料タブが存在し、初期値がALL | OK |
| 2 | タブ切り替え時に数量が保持される | OK（renderConsumptionListで既存入力値を復元） |
| 3 | 各行に「代替」ボタンがあり、モーダルが開く | OK |
| 4 | 代替品モーダルは在庫リストUIを移植（検索・フィルタ・ソート・期限バッジ） | OK |
| 5 | 在庫にある食材だけが選択可能 | OK（state.inventoryを参照） |
| 6 | 単位は元の材料と同じ | OK（unitをそのまま利用） |
| 7 | 代替設定後は「元に戻す」が可能 | OK（clearSubstitution関数） |
| 8 | confirmConsumptionで代替品名で在庫減算 | OK |

### コード品質

| # | 項目 | 結果 |
|---|---|---|
| 1 | 既存機能を壊していない | OK（sortInventoryは後方互換、confirmConsumptionは従来パスも維持） |
| 2 | 新規GAS通信がない | OK |
| 3 | スプシ書き込みはpendingSyncに積む設計 | OK（queueInventoryUpdate/Deleteを利用） |
| 4 | ネイティブダイアログ未使用 | OK |
| 5 | showToastを利用 | OK |
| 6 | HTML構文が正しい | OK（verify通過） |

### セキュリティ・安全性

| # | 項目 | 結果 |
|---|---|---|
| 1 | XSS対策（escapeHtml使用） | OK（動的生成箇所でescapeHtmlを適用） |
| 2 | 不正なidxアクセスの防止 | OK（idx範囲チェックあり） |

## 判定

**APPROVED**

仕様通りに実装されており、既存機能への影響が最小限に抑えられている。
非機能要件（GAS通信抑制、pendingSync利用）も遵守されている。
