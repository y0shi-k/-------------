---
ticket_id: TKT-0184-mobile-horizontal-overflow-fix
status: ready
---

# Report Draft

## 変更目的

PC中心で編集してきたためスマホ幅で全画面が横にはみ出して崩れていた。スマホ表示テストの土台として、
横はみ出し（horizontal overflow）を一掃した。以降の TKT-0185（食材名行の重なり）/ TKT-0186（ボタン
sticky 固定）の前提となる土台チケット。

## 今回追加した安全装置

- `web/src/app/globals.css` の末尾に `@media (max-width: 719px)` ブロックを**新規追記**（PC幅 >=720px の既存ルールは無変更）。スマホ用の調整を1ブロックに集約し、後続チケットと干渉しにくくした。
- `body { overflow-x: hidden }` を保険として追加。意図的な横スクロール（`.location-tab-row` / `.canvas-sort-row` は各自に `overflow-x: auto`）は子要素側で維持されるため潰していない。
- 各原因箇所への対処:
  - `.consumption-row-controls`: `flex: 1 1 auto; min-width: 0; flex-wrap: wrap; justify-content: flex-start`（220px 強制を解除し折返し可に）
  - `.cooking-filter-row`: `repeat(5, …)` → `repeat(2, …)`
  - `.conversion-row`: スマホ2列折返し。`.inventory-editor-modal .conversion-row` は詳細度を上げて既存モーダル値を維持
  - `.cooking-summary-grid`: `repeat(4, …)` → `repeat(2, …)`
  - `.insight-grid` / `.home-feature-grid`: 2列 → 1列

## 実施した確認

- `/verify TKT-0184`: lint / typecheck / test / build すべて **pass**。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）すべて **pass**。`verify.json` に記録。
- `/check-gates`: チケット定義の required_gates（spec_ready / implementation_ready / verify_passed / report_ready）を充足。
- **eval 過剰マッチについて**: check-gates が `supabase_schema_change` 🔴 / `photo_upload_storage` 🔴 を表示したが、これは (1) 写真/storage 等の語彙による過剰マッチ、かつ (2) 検証時点で作業ツリーに**別チケット TKT-0189（料理記録の写真ビューア）の未コミット変更が並行して存在**し、その diff（`cooking-history-board.tsx` 等）を巻き込んだことによる。**本チケットの実変更は `web/src/app/globals.css` のスマホ用メディアクエリ追記のみ**で、Supabase schema / Storage / Auth / RLS には一切触れていない（backlog の TKT-0178/0179 と同じ「語彙過剰マッチ＝report 記録」運用）。したがって manual-smokes.md / review.md は不要。

## 残リスク

- **目視確認が未実施**（実機/DevTools 375px 幅）。`scrollWidth <= innerWidth`、`.conversion-row` の2列折返しの見た目、`.cooking-filter-row` の2列化（5要素が非対称になる可能性／必要なら3列に調整）はユーザー目視で最終確認が望ましい。
- `body { overflow-x: hidden }` は一部ブラウザ（Firefox 等）で `position: sticky` の参照コンテキストに影響しうる。現状の sticky は `top` 方向のみで影響は低いと判断したが、TKT-0186 で sticky を増やす際に挙動を再確認する。問題が出れば `.app-shell` の `overflow-x: clip` へ切り替える。
- 作業ツリーに TKT-0189 の変更が混在しているため、**コミット時は TKT-0184 分（globals.css 末尾のメディアクエリ）と TKT-0189 分を分けること**。

## 次の依頼や人判断

- スマホ実機/DevTools 375px での目視確認（上記残リスク）。
- 続けて TKT-0185（食材管理の食材名行の重なり修正）→ TKT-0186（主要ボタンの sticky 固定）へ。
