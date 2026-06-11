---
ticket_id: TKT-0238-location-picker-label-touch-fix
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

タブレット（タッチ操作）で在庫編集フォームの保存場所ピッカーの候補ボタンが反応せず、未選択のまま保存されて `storage_location.trim() || "その他"` のフォールバックで「その他」になる不具合（ユーザー報告 2026-06-11）の修正。

原因は `inventory-board.tsx` で `LocationTagPicker`（検索input + 候補buttonのポップオーバー）が `<label>` の内側に丸ごと入っていたこと。label 内のインタラクティブ要素は HTML 仕様上不正なネストで、タッチ環境（iPad WebKit 等）ではタップが label 先コントロール（検索input）へのフォーカスに化け、候補ボタンの click が発火しない。PCマウスでは届くため「PCは動くがタブレットだけ反応しない」症状と一致。同一UIのレシピ「ジャンル」ピッカー（recipe-meal-workspace.tsx:2996、`<div className="genre-field-label">` 包み）では問題報告がないことが構造差の根拠。

## 変更内容

- `web/src/components/inventory-board.tsx`
  - 保存場所: `<label className="genre-field-label">保存場所` → `<div className="genre-field-label"><span>保存場所</span>`（レシピのジャンル欄と同構造）
  - 数量・単位: `<label>` ラッパー → `<div className="genre-field-label"><span>数量・単位</span>`。label 内にあった `UnitPicker`（同型ポップオーバー）の潜在的な同問題も解消。NumberField（数値input）は `ariaLabel` を持つため a11y 影響なし
  - 単位換算欄の UnitPicker（既に div 内）・表示期限などの素の input を持つ label は変更なし
- `web/src/app/globals.css`
  - `.inventory-editor-modal .stock-form .genre-field-label` を追記（モーダル内で label に当たっていた 11px・uppercase・slate のラベル見た目を div ラッパーにも適用）

## 今回追加した安全装置

- 既存テスト `inventory-board.test.tsx`（28件）がラッパー変更後も全パスすることを確認（ピッカー内 input の aria-label 参照のため label 依存なし）

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0238` → lint / typecheck / test / build すべて pass、policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）pass
- オーケストレーター（Fable 5 セッション）による diff レビュー: 変更が label→div+span と CSS 最小追記のみであること、aria-label の維持、2カラムレイアウトのクラス維持を確認

## 残リスク

- タブレット実機（iPad WebKit）での再現・修復確認は未実施。原因はコード構造（label 内インタラクティブ要素の不正ネスト）と既知の WebKit 挙動からの推定であり、ユーザーの実機スモークで最終確定する
- 新CSSの `gap: 4px` は旧 label の `margin-bottom: 6px` と厳密同値ではない（視覚上は同等。気になる場合は数値調整のみ）

## 次の依頼や人判断

- ユーザー実機スモーク: タブレットで 食材管理 → 任意の食材を編集 → 保存場所ポップオーバーから候補をタップ → 選択タグが即時反映され、保存後も選んだ場所のままであること（「その他」へ化けないこと）。同様に「数量・単位」の単位ピッカーもタップで選べること
