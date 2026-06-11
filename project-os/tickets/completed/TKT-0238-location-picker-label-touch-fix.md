---
id: TKT-0238-location-picker-label-touch-fix
title: 在庫編集フォームの保存場所/単位ピッカーをlabelネストから外しタブレットタッチ操作を修復
status: completed
goal: タブレット（タッチ操作）で保存場所ピッカーの候補ボタンが反応せず、未選択のまま保存されて「その他」へフォールバックする不具合を防ぐ
acceptance:
  - inventory-board.tsx の保存場所欄が `<label>` ネストではなく、レシピのジャンル欄（recipe-meal-workspace.tsx:2996 の `<div className="genre-field-label"><span>…</span>` 構造）と同じ非labelラッパーになる
  - 同フォーム「数量・単位」内の UnitPicker も label の外（同等の div+span 構造）へ移し、同じタッチ問題の芽を摘む
  - 見た目（CSS適用・レイアウト2カラム）が現状から崩れない（genre-field-label クラスは流用）
  - キーボード/スクリーンリーダー向けの名前付けを維持する（input 側の aria-label は既存のまま）
  - 既存テスト（inventory-board.test.tsx）が通る。label 前提のクエリがあれば追従修正する
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/__tests__/inventory-board.test.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0105-inventory-and-staging-web
related_artifacts:
  - artifacts/TKT-0238-location-picker-label-touch-fix/verify.json
  - artifacts/TKT-0238-location-picker-label-touch-fix/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0238`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
  - 非危険変更（UIのみ）。必須成果物は verify.json + report.md
---

# Summary

タブレットで在庫編集の保存場所を変更できず、保存時に `storage_location.trim() || "その他"`（inventory-board.tsx:175）で「その他」になる不具合の修正。

## 原因（調査済み・2026-06-11）

- `inventory-board.tsx:1405-1413` で `LocationTagPicker`（検索input + 候補buttonのポップオーバー）が `<label className="genre-field-label">` の**内側**に丸ごと入っている。
- label 内のインタラクティブ要素（button）は HTML 仕様上不正なネストで、タッチ環境（iPad WebKit 等）ではタップが label 先コントロール（検索input）へのフォーカスに化け、候補ボタンの click が発火しない。PCマウスでは届くため「PCは動くがタブレットで反応しない」と一致。
- 同一UIのレシピ「ジャンル」ピッカーは `<div className="genre-field-label"><span>ジャンル</span>…</div>`（recipe-meal-workspace.tsx:2996）で、こちらは問題報告なし。この構造に合わせる。
- 同フォームの「数量・単位」`<label>`（1416-1427行）内の `UnitPicker` も同型の潜在問題。併せて外へ出す。
  - NumberField（数値input）は label 配下のままで実害なし。ポップオーバー型ピッカーだけが対象。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 編集対象は `web/` のみ。Canvas版 `app.html` は凍結・参照専用（編集しない）
- GAS/Spreadsheet/Drive を使わない。APIキー直書きなし。schema/auth/RLS/Storage 無変更
- 2カラムの form-row 構造（label と div が混在する）になるため、`.form-row.two-columns > div` でも label と同じ縦積みレイアウトになるか CSS を確認。必要なら globals.css に最小追記

## 残リスク

- タブレット実機での再現・修復確認は本セッションでは不可（コード根拠と既知のWebKit挙動からの推定）。ユーザーの実機スモークで最終確認する
