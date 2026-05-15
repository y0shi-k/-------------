# Review — TKT-0009

## Reviewer
- AI self-review

## Checked Diff Paths
- [x] app.html

## Review Items

### 1. 変更範囲の妥当性
- 変更は `app.html` のみ
- syncBar の表示/非表示制御のみ追加
- モーダルのレイアウト・z-index・デザインは変更なし
- スプシ同期ロジックは変更なし

### 2. 実装パターンの一貫性
- 全8つのモーダルで同一パターンを適用:
  - 開く側: `document.getElementById('syncBar').classList.add('hidden');`
  - 閉じる側: `updateSyncBar();`
- 既存の `updateSyncBar()` を再利用しており、DRY原則に従っている

### 3. 副作用の有無
- `updateSyncBar()` は未同期件数を判定して表示/非表示を制御する既存関数
- モーダル閉じた後に未同期が0なら非表示のまま、1以上なら表示される
- 既存の動作に影響を与えない

### 4. コード品質
- 最小変更で目的を達成
- alert/confirm/prompt の使用なし
- showToast の使用なし（該当しない）
- 既存のコーディングスタイルに準拠

## Approval
- Status: APPROVED
- Notes: 実装は受理可能。Canvas環境での手動スモークテストで最終確認推奨。
