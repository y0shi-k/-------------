# Review — TKT-0010

## Reviewer
- AI self-review

## Checked Diff Paths
- [x] app.html

## Review Items

### 1. 変更範囲の妥当性
- 変更は `app.html` のみ
- syncBar の位置・表示制御、main の padding のみ変更
- スプシ同期ロジックは変更なし
- ボタン配置・デザインは変更なし

### 2. 実装パターンの一貫性
- CSS クラス `.sync-bar-hidden` / `.sync-bar-visible` を新規追加
- `updateSyncBar()` で一貫してクラス切り替えを使用
- モーダル関数でも同じクラス操作を使用

### 3. 副作用の有無
- `main#app` に `pt-14` を追加したため、初期画面・在庫画面・レシピ画面すべてで上部に56pxのスペースが確保される
- これにより syncBar の表示/非表示でコンテンツが上下にずれない
- 下部の `pb-24` は維持され、bottom nav 用のスペースも確保される

### 4. コード品質
- 最小変更で目的を達成
- alert/confirm/prompt の使用なし
- 既存のコーディングスタイルに準拠
- TKT-0009 のモーダル連動制御も正しく移行されている

## Approval
- Status: APPROVED
- Notes: 実装は受理可能。Canvas環境での手動スモークテストで最終確認推奨。
