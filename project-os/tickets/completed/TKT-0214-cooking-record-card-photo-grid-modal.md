---
id: TKT-0214-cooking-record-card-photo-grid-modal
title: 料理記録カードのUI刷新（複数写真を横並び＋行クリックで写真モーダル＋モーダル内にレシピ導線）
status: completed
goal: 料理記録カードが先頭1枚しか出さずPC幅の横余白を活かせていない状態を改善し、操作を「行クリック→写真モーダル」に集約してレシピ導線をモーダルへ移す。
acceptance:
  - 料理記録カードで、1枚目の写真は従来どおり左端の枠に表示される
  - 複数写真がある記録は、2枚目以降が本文の右側にサムネ格子として表示され、PC幅では余白に入る枚数だけ列が増える（幅に応じて列数可変）
  - 表示枠に収まらない分は最後のサムネに `+N` の残数オーバーレイが出て、クリックで写真モーダル（全枚）が開く
  - 写真が無い記録は従来どおり「写真なし」表示になり、レイアウトが破綻しない
  - 料理記録カードの行（カード本体）クリックで、写真サムネクリックと同じ写真モーダル（`CookingRecordViewModal`）が開く
  - カード本体にあった「レシピを見る」ボタンは廃止され、カード上には表示されない
  - 「編集」ボタンはカードに残り、クリックしても写真モーダルは開かず編集モーダルのみが開く（イベント伝播を止める）
  - 写真モーダル内に、記録に `recipe_id` がある場合のみ「レシピを見る」ボタンが表示され、押すと該当レシピ表示に遷移する（`recipe_id` が無い記録ではボタンを出さない）
  - スマホ幅（640px以下）ではサムネ格子が縦余白を圧迫せず、従来同等の縦積み/左1枚表示に縮退する
  - キーボード操作でカードを開けるアクセシビリティを確保する（role/tabIndex 等）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/cooking-history-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0214-cooking-record-card-photo-grid-modal/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0214-cooking-record-card-photo-grid-modal/verify.json
  - artifacts/TKT-0214-cooking-record-card-photo-grid-modal/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0214`。コマンドの正本は `harness/registry.json`
  - 非危険変更（写真の「表示」改修のみ。既存の署名URLキャッシュ `photoUrlMap` を再利用し、アップロード/圧縮/Storage保存/バケット設定には一切触れない）。必須成果物は verify.json + report.md のみ
  - `photo|image|写真|画像` が diff に出るため `photo_upload_storage` 正規表現に機械マッチし得るが、撮影/圧縮/Storage保存は変更しない（表示のみ）。manual-smokes/review は不要
---

# Summary

料理記録カード（`HistoryDateGroup` 内の `.history-item`）は複数写真があっても 80px 正方形の先頭1枚のみ表示し、PC幅でカード内の横余白が空いている。あわせて現状はカード本体に「レシピを見る」ボタンがあり、写真モーダルは写真クリックでしか開かない。

本チケットでは (1) 2枚目以降を本文右側のサムネ格子に並べて余白を活用し、(2) カード行クリックで写真モーダルを開く操作に集約、(3) カードの「レシピを見る」を廃止してモーダル内へ移す。すべて `web/src/components/cooking-history-board.tsx` と `web/src/app/globals.css` の presentational 改修。

`required_evals` は写真の表示・レスポンシブレイアウト改修で、DBスキーマ・auth/RLS・写真Storage（保存）・AIルート・CSV移行に該当しない（非危険）。PC/スマホ双方の表示確認対象として `pwa_mobile_ui`。

## 実装メモ

- 対象ファイル: `web/src/components/cooking-history-board.tsx`, `web/src/app/globals.css`
- カード（436–463行 `.history-item`）:
  - `history-card-actions` の「レシピを見る」ボタン（455–461行）を削除。
  - `<article className="history-item">` 全体をクリック可能にして `onView(item)` を発火（行クリック＝写真モーダル）。`<article>` はボタンではないので内側 `<button>` のネスト問題は起きないが、キーボード操作のため `role="button"` + `tabIndex={0}` + Enter/Space ハンドラを付けるか、本文領域を覆うクリック要素にする。
  - 「編集」ボタン（437–439行 `history-edit-button`）は残し、`onClick` で `event.stopPropagation()` してから `onEdit(item)`（行クリックの写真モーダルを開かない）。
  - 写真/サムネのクリックは `onView(item)` を呼ぶ（行 onClick と二重に発火しても `setViewingItem(item)` は冪等なので実害は無いが、明示的に `stopPropagation` してよい）。
- 写真サムネ（`HistoryPhoto`, 565–597行）の拡張 or 兄弟コンポーネント追加:
  - 1枚目は現状の左端80px枠（`history-photo` / `history-photo-button`）を維持。
  - 2枚目以降（`photosWithPath.slice(1)`）を本文の右側に配置するサムネ格子を新設。`photoUrlMap`（`useCachedSignedUrls` 由来、既存 290–294行や 519–522行と同じ引き方）から URL を解決。
  - 表示上限を超える分は最後のサムネに `+N` オーバーレイ（残枚数）を出し、クリックで `onView(item)`。
- 写真モーダル（`CookingRecordViewModal`, 493–563行）:
  - props に `onViewRecipe: () => void`（または `recipeId`）を追加し、`cooking-record-view-actions`（552–559行）に「レシピを見る」ボタンを `item.recipe_id` がある時のみ追加。
  - 呼び出し側（391–398行）で `onViewRecipe={() => requestViewRecipe(viewingItem.recipe_id!, "cooking")}` を渡す（既存の `requestViewRecipe` / `onViewRecipe` 経路を流用。タイムラインビューの導線と一貫させる）。
- CSS（`web/src/app/globals.css`）:
  - `.history-item` のグリッドを「左80px ＋ 本文 ＋ 右サムネ格子」に対応する3カラム（例: `grid-template-columns: 80px minmax(0,1fr) auto`）へ調整。右カラムはサムネ格子（`repeat(auto-fill|auto-fit, minmax(…px,…))` で幅に応じ列数可変）。
  - サムネ格子・`+N`オーバーレイ・モーダル内「レシピを見る」ボタンのスタイルを追加。既存の `.history-photo-count-badge` / `.cooking-record-view-photos` の表現に体裁を合わせる。
  - `@media (max-width: 640px)` で右サムネ格子を畳み、従来の左1枚＋縦積みに縮退（既存のモバイル分岐に追記）。
- 既存パターン/再利用:
  - 署名URL解決は `photoUrlMap`（`useCachedSignedUrls`）を使い、**新規に署名URLを発行しない**。
  - `displayRecipeName` / `renderStars` / `ratingLabel` などカード内の既存ヘルパをそのまま使う。
- 注意: GAS/Spreadsheet/Drive 不使用。APIキー直書き禁止。写真の保存・圧縮・バケット設定には触れない（表示のみ）。

## 非ゴール

- 写真のアップロード・圧縮・Storage保存・並び替え・削除の挙動変更（撮影/保存フローは対象外）。
- 写真モーダルのライトボックス機能拡張（ズーム・スワイプ・個別フルスクリーン等）。
- タイムラインビュー（365–377行）のカードレイアウト刷新（本チケットは `HistoryDateGroup` 共通改修の範囲。タイムライン側も同じ `HistoryDateGroup` を使うため自然に追従するが、専用調整は含めない）。

## 依存チケット

- TKT-0213（同じ `cooking-history-board.tsx` / `HistoryDateGroup` を先に改修。予定行が入った状態の上にカードUI刷新を重ねる）

## 残リスク

- 行クリックと内側ボタン（編集・写真）のイベント伝播設計を誤ると、編集を押したのに写真モーダルが開く/二重発火する。stopPropagation の付与箇所を verify 時に手元確認する。
- 右サムネ格子の列数可変はカード幅に依存するため、幅が狭い文脈（タイムラインビュー等）でサムネが潰れないか確認する。
