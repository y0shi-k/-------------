---
ticket_id: TKT-0160-web-desktop-cooking-layout
status: passed
review_scope:
  - SPEC-0160-web-desktop-cooking-layout
  - TKT-0160-web-desktop-cooking-layout
---

# Review Record

## checked_diff_paths

- `web/src/components/cooking-history-board.tsx` — `useShellSubView` 購読、`selectedSubViews.cooking → historyView` 同期 useEffect、`switchHistoryView`（`setHistoryView` + `selectShellLeaf`）導入、内部タブ onClick の差し替え。
- `web/src/app/globals.css` — `@media (min-width:1024px)` 内に `.cooking-view-tabs` 非表示・タイムライン複数カラム・カレンダーセル/サムネ拡大・インサイト広幅化を追加。
- `web/src/__tests__/cooking-history-board.test.tsx` — `useShellSubView` モック追加、葉同期テスト・サブビュー駆動テストを追加。

## checked_artifacts

- `project-os/artifacts/TKT-0160/verify.json`（status=pass、policy 全 pass）
- `project-os/artifacts/TKT-0160/manual-smokes.md`（static_only、過剰マッチの根拠を記録）
- `project-os/artifacts/TKT-0160/report.md`

## subagent_usage

- なし（単一画面のレイアウト + 軽微な state 持ち上げのため、メインで実装・確認した）。

## findings

- **データ保護観点（RLS / Storage 公開）**: 本変更は Supabase schema・RLS・Storage バケット設定・写真アップロード/保存処理のいずれにも触れていない。`supabase/` に差分なし。写真は既存の署名付きURL（`photo.signed_url`）表示のまま。→ 🔴 eval（`supabase_schema_change` / `photo_upload_storage`）は**誤検知**であり、データ保護上の新規リスクは無い。
- **誤検知の原因**: `change_evals.json` の `paths_any: ["web/"]` と `diff_regex_any` の `photo|image|写真`・`recipes|cooking_history|photos` が、レイアウトコードや**テストfixture/モックの語彙**に当たる。実ロジックの危険性とは無関係。
- **スマホ温存**: PC専用変更は `@media (min-width:1024px)` 内に閉じ、既存のモバイル/`max-width:640px` 規定を上書きしていない。同期 useEffect はビュー値のみを反映し、スマホの内部タブ操作（`switchHistoryView`）も従来どおり表示が切り替わる。
- **規約適合**: `@/` エイリアス使用、immutable、console.log なし。確立済みパターン（recipe-meal-workspace / inventory-board の `selectedSubViews` 同期）に一致。

## open_risks

- 実機（PC/スマホ）でのレイアウト目視は未実施。
- 同種の語彙ベース過剰マッチは将来のレイアウト系チケットでも発生しうる。

## verdict

passed — レイアウトと表示state同期に限定された変更で、データ保護・写真Storage に実質的影響なし。🔴 eval は語彙による誤検知と判断。実機目視のみ残課題。
