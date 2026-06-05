---
id: TKT-0158-web-desktop-inventory-layout
title: 食材管理のPC多カラム化（食材一覧グリッド＋AI食材登録レイアウト）
status: implementation_ready
goal: PC幅で食材管理を添付モックの「食材一覧グリッド」「AI食材登録（アップロード枠＋認識チップのグリッド）」に寄せ、広画面の余白を活かしたカード配置にする（スマホは温存）
acceptance:
  - 【IA: グループ化ツリー】PCではサイドバー「食材管理」グループ配下の葉「在庫一覧」「買い物リスト」を選ぶと該当ビューに切り替わる。食材管理の内部表示切替（`canvas-mode-control`「食材管理の表示切替」）はPCではサイドバーに一本化し、コンテンツ内では隠す（スマホは内部切替のまま）
  - 食材管理のサブビュー状態を TKT-0157 のシェルから controlled/initial prop で受け取れるよう持ち上げる（スマホの既存挙動は不変）
  - 「今日の献立」（`today-dashboard`）はホーム(TKT-0162)へ集約する方針のため、サイドバーの葉にはしない（食材管理内での扱いは spec で確定）
  - PC幅（≥1024px）で食材一覧が複数カラムのカードグリッドになり、絵文字/写真アイコン付きの食材カードが並ぶ（モック「食材一覧」相当）
  - PC幅でAI食材登録（写真スキャン）が、アップロード枠と認識済み食材チップのグリッドを左右/多カラムで配置する（モック「AI食材登録」相当）
  - 保存場所タブ・並び順・選択/すべて選択・数量ステッパー・編集/削除など既存操作がPC/スマホ両方で動く
  - 買い物リスト・登録待ち・写真AI解析の入口が崩れない
  - スマホ幅では従来の単一カラム表示・挙動を一切変えない
  - 写真スキャン/登録のロジック（Storageアップロード・AI解析API）は変更しない（レイアウトのみ）
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0158-web-desktop-inventory-layout/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0158-web-desktop-inventory-layout
related_artifacts:
  - artifacts/TKT-0158-web-desktop-inventory-layout/verify.json
  - artifacts/TKT-0158-web-desktop-inventory-layout/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（デスクトップシェル）の完了が前提。サイドバー葉「在庫一覧/買い物リスト」が食材管理のサブビューを駆動する（TKT-0157 で定義する受け渡し口を使う）。
  - 【IA: グループ化ツリー（2026-06-03 確定）】PCはコンテンツ内の表示切替をサイドバーへ一本化し、内部タブを隠す。スマホは内部タブ維持。サブビュー state の持ち上げ（小リファクタ）が必要。
  - レイアウト中心の変更だが `inventory-board.tsx` は写真スキャン/AI解析の語を含むため、`/check-gates` の diff 自動判定で `photo_upload_storage` / `ai_server_route` に過剰マッチする可能性がある。その場合は manual-smokes.md / review.md を追加し required_gates に `manual_smokes_done` / `review_ready` を足す（最終確定は `/check-gates TKT-0158`）。
  - 写真Storageアップロード・AI解析APIのロジックは変更しない。グリッド/カラムの再配置とCSSが中心。
  - 現コードでは `TodayDashboard` は `InventoryBoard` に内包されていないため、TKT-0158では `today-dashboard.tsx` を変更しない。ホーム集約は TKT-0162 で扱う。
  - verify は `/verify TKT-0158`。Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。Gemini APIキー・署名付き写真URLを表示・ログに出さない。
---

# Summary

PC幅で食材管理（`InventoryBoard`）を添付モックに寄せる。対象はモックの2面: **「食材一覧」（食材カードのグリッド）**と**「AI食材登録」（アップロード枠＋認識チップのグリッド）**。広画面の余白を活かして単一カラムから多カラムへ。スマホは温存。

## 背景

- 食材管理は `web/src/components/inventory-board.tsx`。買い物リストは `shopping-list-section` を内包する。現コードでは `today-dashboard`（今日の献立）は内包していないため、TKT-0158では触らない。
- 現状 `.inventory-grid` は `grid-template-columns: 1fr`（720pxでも1fr）で、広画面でも単一カラムに近い。
- 既存タイル/カード作法（`.cooking-summary-tile` 等の絵文字パステルタイル、`.stock-panel`）を流用できる。

## 実装メモ

- `.inventory-grid` / 食材一覧（`.canvas-inventory-list`）をデスクトップ幅で複数カラムのカードグリッドに（既存の保存場所タブ・並び替え・選択UIは維持）。
- AI食材登録（写真スキャンモーダル `.photo-scan-modal` / `.scan-candidate-*`）を、デスクトップ幅でアップロード枠＋候補チップのグリッドに再配置。
- 数量ステッパー・編集/削除アイコン・選択/すべて選択など既存操作はそのまま。DOM構造の変更は最小にし、まずCSS（メディアクエリ）で実現できる範囲を優先。必要なJSXの調整は最小限。
- スマホ幅のCSS（`@media (max-width: 640px)` 等）は触らず、デスクトップ用メディアクエリを追加する。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
- 写真Storage/AI解析のロジックは変更しない（レイアウトのみ）。

## 残リスク

- `inventory-board.tsx` が大きく、写真/スキャン語を含むため `/check-gates` が危険evalへ過剰マッチし、manual-smokes/review が必要になる可能性。
- 多カラム化でカード内の数量入力・単位ピッカー（TKT-0154/0155）の幅前提が崩れないか要確認。
- 実機（PC/スマホ両方）での目視は別途。
