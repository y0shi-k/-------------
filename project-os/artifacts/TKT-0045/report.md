---
ticket_id: TKT-0045-recipe-editor-drag-drop-reorder
status: completed
---

# Report

## 変更目的

レシピ編集モーダル内の材料・調味料・下ごしらえ・調理工程の各行をドラッグ＆ドロップで並び替え可能にし、上下ボタン（↑↓）を削除して UI をスッキリさせる。

## 今回追加した安全装置

- HTML5 Drag and Drop API を使用（Canvas 環境でも動作する標準 API）
- `initRecipeDragDrop()` を汎用関数化し、4 セクションで再利用
- `_dragInited` フラグでイベントリスナーの重複登録を防止
- ドラッグ中・ドロップ位置の視覚的フィードバック（opacity / border-top）
- 工程行の連番自動再採番（`renumberCookSteps` / `renumberPrepSteps`）

## 実施した確認

1. HTML構文チェック: `python3 -c "import html.parser; ..."` → PASSED
2. GAS通信パターン確認: `grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html` → PASSED
3. Canvas環境チェック:
   - `alert(` / `confirm(` / `prompt(` なし → PASSED
   - `showToast` 関数あり → PASSED
   - 個別 `executeGAS(payload...)` なし → PASSED
4. スキーマ変更なし
5. GASコード変更なし
6. UI整合性：ドラッグハンドルが既存の Tailwind クラス構成と一致

## 残リスク

- タッチデバイス（スマートフォン・タブレット）での HTML5 D&D はブラウザ実装依存。完全なタッチ対応が必要な場合は将来的に touch events ベースの実装を検討
- ドラッグハンドル（材料・調味料行の ≡ アイコン）が小さすぎてタップしにくい可能性がある。タッチデバイス使用時のフィードバックを募集中

## 次の依頼や人判断

- Canvas環境（デスクトップブラウザ）で実際にドラッグ＆ドロップが動作するか検証してほしい
- タッチデバイスで使用する場合は、タッチイベントベースの実装が必要か判断してほしい
