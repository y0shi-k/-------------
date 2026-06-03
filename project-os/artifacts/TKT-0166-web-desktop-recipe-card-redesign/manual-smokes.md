---
ticket_id: TKT-0166-web-desktop-recipe-card-redesign
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> 本チケットの実変更は非危険（CSS + 1行JSX）。check-gates が🔴危険（supabase_schema_change / photo_upload_storage）を過剰マッチしたため、念のため本書を作成するが、対象は写真Storage/schema ではなく**PC/スマホのレイアウト回帰**である。

## target_evals

- pwa_mobile_ui（実体に即した対象。PCトーン統一＋スマホ温存の回帰確認）。
- 過剰マッチした supabase_schema_change / photo_upload_storage は実コード変更なしのため対象外（review.md 参照）。

## executed_checks

- `npm run build` / `lint` / `typecheck` / `test`: pass（verify.json）。
- CSS構造の静的確認:
  - 縦型カード上書きが `@media (min-width: 1024px)` 内に限定されていること。
  - 名前の2行クランプ（`-webkit-line-clamp: 2`）と1文字省略の解消。
  - 操作ボタンが `position: absolute` + `opacity` でホバー/フォーカス表示に退避。
  - メタ/ジャンルタグの `flex-wrap: wrap` による溢れ防止。
  - ベース（スマホ）`.recipe-card` と `@media (max-width: 640px)` 上書きが未変更であること。
- `supabase/` 未編集、Storage/Auth/schema コードの追加なしを確認。

## skipped_checks

- 実機ブラウザでのPC幅（>=1024px）目視: レシピカードが縦型4列で表示され、名前が2行で潰れず、ホバーで操作ボタンが出ること。→ **要ユーザー目視**（このセッションではブラウザ操作を実行していない）。
- 実機ブラウザでのスマホ幅（<=640px）目視: 既存の横型カードと選択/料理する/編集/削除が従来どおり動くこと。→ **要ユーザー目視**。

## open_risks

- 上記 skipped の実機目視が未了。レイアウトはCSS構造上スマホへ影響しない設計だが、最終確認は実機で行うのが安全。
- ジャンルタグの彩度調整・「料理する」グリフのアイコン化は本チケット範囲外（残課題）。
