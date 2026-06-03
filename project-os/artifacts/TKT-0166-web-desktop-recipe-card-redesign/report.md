---
ticket_id: TKT-0166-web-desktop-recipe-card-redesign
status: ready
---

# TKT-0166 実装レポート

## 変更目的

PC幅のレシピ一覧カードが横型を約4列に押し込み、「レシピ名が1文字省略（究…）・操作ボタン過密・ジャンルタグ溢れ」で崩れていた。`docs/design/pc-design-language.md` §3.5 に沿って縦型カード（上部ビジュアル・プレースホルダ＋名前2行＋メタ）へ刷新し、後続のPC画面で再利用するデザイントークン（`--accent-soft` / `--favorite` / `--shadow-card`）を `:root` に導入した。

## 今回追加した安全装置

- 変更は CSS（`globals.css`）と、レシピカード上部プレースホルダの中身を `III` → レシピ頭文字に変えた**1行のJSX**（`recipe-meal-workspace.tsx`）のみ。データ処理・状態管理・保存処理は無改変。
- 縦型カードのレイアウトは `@media (min-width: 1024px)` 内に閉じ、ベース（スマホ）の横型カードと `@media (max-width: 640px)` 上書きは変更していない。→ スマホ温存。
- schema / auth・RLS / 写真Storage / AI route / migration には一切触れていない。`supabase/` は未編集。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0166-...`: VERIFY_PASSED（lint / typecheck / test / build すべて pass）。policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present すべて pass。
- `harness/bin/check_gates.py`: `supabase_schema_change` / `photo_upload_storage` を🔴危険と判定したが、**これは過剰マッチ（false positive）**。原因は本チケット・デザイン正本・decisions の散文に「recipes / photos / 写真 / 画像」等の語が含まれ、diff_regex（path=web/ かつ正規表現）に prose が一致したため。実コード差分は CSS + 1行JSXのみで、Storage/Auth/schema/migration コードは含まない（`supabase/` 未編集、`upload(`/`Storage`/`create table` 等のコード追加なし）。詳細は review.md / manual-smokes.md 参照。
- 静的確認: 縦型化は PCメディアクエリ内に限定。名前は `-webkit-line-clamp: 2` で2行クランプ（1文字省略を解消）。操作ボタンは `position: absolute` + ホバー/フォーカスで表示しサムネ右上へ退避。メタ行・ジャンルタグは `flex-wrap: wrap` で溢れ防止。

## 残リスク

- 実機ブラウザでのPC/スマホ目視は未実施（要ユーザー目視）。特にPCの4列折り返し、ホバー操作ボタンの出現、スマホ回帰。
- 「料理する」ボタンのグリフが既存実装のまま文字 `III`（ホバーオーバーレイ内に表示）。本チケット範囲外のため未変更。気になる場合は別途アイコン化を検討（軽微フォローアップ）。
- ジャンルタグの彩度を落とす具体値（設計正本 §7 未決）は今回は据え置き。多色のまま折り返し対応のみ。indigo単色化等は実画面確認後に別途。

## 次の依頼や人判断

- PC/スマホ実機でカードの見た目と崩れ解消を目視確認する。
- お気に入りハート（`recipes.is_favorite` 新設）は危険変更のため TKT-0167 で対応する。
- ジャンルタグのトーン調整、「料理する」グリフのアイコン化を後続でやるか判断する。
