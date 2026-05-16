# TKT-0032 完了報告

## タイトル
保存場所タブに件数バッジを表示

## 実装内容

食材管理画面（モードA）の保存場所選択タブ（「すべて」「冷蔵庫」「冷凍庫」「パントリー」...）に、各場所に紐づく在庫件数をバッジで表示する機能を追加しました。

### 変更ファイル
- `app.html` — `renderInventoryPrimaryRow()` 関数の拡張のみ

### 実装詳細
- 「すべて」タブ: `state.inventory.length`（総在庫件数）
- 各保存場所タブ: `state.inventory.filter(item => item.loc === loc).length`
- バッジスタイル:
  - アクティブ時: `bg-indigo-100 text-indigo-700`
  - 非アクティブ時: `bg-white/60 text-slate-500`
- 件数0でも「0」と表示（hiddenにしない）

### 既存機能への影響
- `getLocationTabClass()` は変更せず、既存のロジックを壊さない
- `renderList()` → `renderModeControls()` → `renderInventoryPrimaryRow()` の既存呼び出しパスを利用
- スプレッドシート書き込みは関与しない（純粋な表示層の変更）

## Verify結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# => VERIFY_PASSED
```

追加チェック:
- `alert/confirm/prompt` 残存なし
- `showToast` 関数存在確認済み
- `syncPendingChanges()` 経由の同期パターン維持済み

## 残タスク

- Canvas実機でのフォントレンダリング・safe-area確認（手動）

## Artifacts

- `project-os/tickets/TKT-0032-location-tab-count-badges.md`
- `project-os/artifacts/TKT-0032/verify.json`
- `project-os/artifacts/TKT-0032/manual-smokes.md`
- `project-os/artifacts/TKT-0032/review.md`
- `project-os/artifacts/TKT-0032/report.md`
