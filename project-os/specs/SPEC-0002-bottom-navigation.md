# SPEC-0002-bottom-navigation.md

## 概要

Phase 2（献立プランナー）・Phase 3（クッキングビューア）へ向けたモード切り替えの基礎 UI を構築する。画面下部に固定のボトムナビゲーションバーを設置し、モード A / B / C をワンタップで切り替える SPA 構成とする。

## Acceptance Criteria

1. **ボトムナビゲーションバー**
   - 画面下部に固定表示（`fixed bottom-0`）
   - `glass-nav` クラス（既存スタイル）を適用
   - safe-area 対応：`pb-[env(safe-area-inset-bottom)]`
   - タップ領域 48px 以上確保

2. **モード切り替え**
   - モード A：🍳 食材管理（在庫管理・買い物リスト・登録待ち）
   - モード B：📅 献立・レシピ（Phase 2 未実装 → Coming Soon）
   - モード C：🍽️ 料理・記録（Phase 3 未実装 → Coming Soon）
   - `state.currentMode` で管理、DOM 書き換え方式
   - ページリロード不要

3. **モード A（既存画面の移行）**
   - 現状の `inventoryView` を `modeAView` コンテナでラップ
   - 在庫タブ（すべて / 冷蔵庫 / 冷凍庫 / パントリー）および買い物リスト・登録待ちタブはそのまま動作
   - `renderList()` / `filterByLocation()` 等の既存ロジックは変更しない

4. **モード B / C（プレースホルダー）**
   - ミニマル表示：中央にアイコン + タイトルのみ
   - フェーズ情報は最小限（「Phase 2 で実装予定」等）

5. **技術制約**
   - 単一 HTML ファイル（`app.html`）内に実装
   - Tailwind CSS の既存クラス構成を踏襲
   - `executeGAS()` 関数を必ず通す（本機能では GAS 通信なし）
   - スキーマ変更なし

## 影響範囲

- `app.html` のみ
- `state` オブジェクトに `currentMode: 'A'` を追加
- 新規関数：`switchMode(mode)`
- `handleInit()` の初期表示ロジックを微調整（`switchMode('A')` 呼び出し）

## 参考

- 要件定義書 §1 UI構造：ボトムナビゲーションバー設置
- TKT-0002-bottom-navigation.md
