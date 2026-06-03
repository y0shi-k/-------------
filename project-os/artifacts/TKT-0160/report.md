---
ticket_id: TKT-0160-web-desktop-cooking-layout
status: ready
---

# Report Draft

## 変更目的

PC幅（≥1024px）で料理・記録（`CookingHistoryBoard`）を広画面向けに多カラム化した。TKT-0157 のデスクトップシェルでサイドバー葉「カレンダー / タイムライン / インサイト」が用意されたが、本体は中央狭幅前提のままで余白が間延びし、内部ビュータブ（`.cooking-view-tabs`）とサイドバー葉が二重化していた。これを解消し、サマリー・タイムライン・カレンダー・インサイトを広幅で見やすく再配置した。スマホ表示・操作・配色は変更していない。

主な変更:
- `cooking-history-board.tsx`: `useShellSubView()` を購読し、`selectedSubViews.cooking` を `historyView` に同期する useEffect を追加。内部タブの onClick を `setHistoryView` 直呼びから `switchHistoryView`（`setHistoryView` + `selectShellLeaf("cooking", view)`）経由に変更。recipe-meal-workspace / inventory-board と同形の確立済みパターンを踏襲。
- `globals.css`: `@media (min-width:1024px)` 内に、PCで `.cooking-view-tabs` を非表示、タイムライン履歴カードを複数カラム自動配置（`repeat(auto-fill, minmax(320px,1fr))`）、カレンダーセル拡大（min-height 72→110px、写真サムネ height 34→60px）、インサイトの広幅2〜3列化を追加。
- `cooking-history-board.test.tsx`: `useShellSubView` モック追加と、タブ選択がサイドバー葉に同期すること・サブビュー選択でビューが切り替わることのテストを追加。

## 今回追加した安全装置

- 写真Storage・記録の保存/読込ロジックは一切変更していない（レイアウトと表示state同期のみ）。写真は既存の Supabase 署名付きURL（`photo.signed_url`）表示のまま。
- PC専用の変更は `@media (min-width:1024px)` 内に閉じ込め、スマホ/タブレットの既存規定は上書きしていない。
- `historyView` と `CookingShellLeaf`（calendar/timeline/insights）は値が一致するため、型安全に同期できる。

## 実施した確認

- `/verify TKT-0160`: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）すべて pass。`verify.json` は status=pass。
- `/check-gates TKT-0160`: 後述のとおり `photo_upload_storage` / `supabase_schema_change`（いずれも🔴）に過剰マッチしたため、manual-smokes.md / review.md を併せて作成し、required_gates に `manual_smokes_done` / `review_ready` を追加した。
- 追加テスト2件（サイドバー葉同期 / サブビュー駆動）を含む既存テストが green。

## 残リスク

- 実機（PC/スマホ両方）での目視確認は未実施。広幅でのタイムライン複数カラム・カレンダーセル拡大時の写真サムネ/ドット表示の最終確認は別途必要。
- `cooking-history-board.tsx`・テストが写真/Storage/テーブル名の語彙を含むため、`/check-gates` の diff 自動判定が 🔴 eval に過剰マッチする。実コードはレイアウトのみだが、判定の都合上 manual-smokes/review が必要になった（誤検知であることは review.md に記録）。

## 次の依頼や人判断

- PC/スマホ実機での目視確認（サイドバー葉切替→ビュー表示・内部タブ非表示、複数カラム/カレンダー拡大/インサイトの破綻なし、スマホ従来どおり）。
