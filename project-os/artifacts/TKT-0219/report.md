---
ticket_id: TKT-0219-cooking-viewer-photo-toggle
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

調理ビュー（`cooking-overlay` 全画面）のヘッダーにはレシピ名と参考元リンクしかなく、どの料理かを画像で確認できなかった。ヘッダー左上（戻るボタン直後）にレシピ登録写真を表示し、初期は開・トグルで隠せるようにした。

- `web/src/components/recipe-meal-workspace.tsx`: state `isCookingPhotoOpen`（初期 `true`）を追加。`openCookingViewer` で開状態にリセット。ヘッダーに `cooking-overlay-photo-block` を追加し、既存の署名付きURL `recipeImageUrls.get(activeCookingRecipe.id) ?? null` を `RecipeThumb` で表示。トグルボタンに `aria-label` / `aria-expanded` / `title` を付与。
- `web/src/app/globals.css`: 写真ブロック・サムネイル（モバイル 56×42px / 720px以上 72×54px）・トグルボタン・閉状態（`data-open="false"`）のスタイルを追加。

## 今回追加した安全装置

- 写真未登録レシピでは `RecipeThumb` の既存プレースホルダ表示にフォールバックし、トグルがあっても破綻しない。
- 閉状態では写真領域を畳み（幅をトグルボタン分に縮小）、ヘッダーのタイトル・操作ボタン（戻る/スケジュール追加/編集）と重ならない（`flex-shrink: 0` でタイトル潰れも防止）。
- ユニットテスト2件を追加: トグルで写真の表示/非表示が切り替わること、ビューを開き直すと開状態にリセットされること。

## 実施した確認

- `/verify TKT-0219`: lint / typecheck / test（37ファイル・323件全パス、新規2件含む）/ build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）も pass。`verify.json` 参照。

## 残リスク

- 実機（スマホ実機幅）でのヘッダーレイアウト目視は未実施。テストは jsdom のため、PC/スマホ幅の重なりは CSS 設計（flex + 固定サムネイルサイズ）で担保している。

## 次の依頼や人判断

- なし。`/check-gates` が diff の「写真/image」語で photo_upload_storage / supabase_schema_change を match させたが、本チケットは**表示のみ**で、Supabase Storage のアップロード・権限・バケット・署名URL取得ロジック、および調理完成写真（cooking_history.photos）には一切手を入れていない（manual-smokes.md / review.md に詳細）。

## 追補（2026-06-11 ユーザーフィードバック反映）

「ヘッダーのサムネが小さすぎる」との指摘により、写真の配置を変更した:

- ヘッダーの `cooking-overlay-photo-block`（56×42px サムネ＋トグル）を**削除**し、ヘッダーは「戻る/タイトル/スケジュール追加・編集」のみに戻した。
- 写真は CookingViewer の**左ペイン（材料 `.cooking-pane-ing`）最上部**に `cooking-pane-photo` ブロックとして移設。`RecipeThumb size="hero"`（ペイン幅いっぱい・aspect-ratio 16/9・角丸10px）で大きく表示する。
- CookingViewer に props `imageUrl` / `isPhotoOpen` / `onTogglePhoto` を追加（state は従来どおり親の `isCookingPhotoOpen`、開き直しで開にリセット）。
- トグルは開時=写真右上のオーバーレイ小ボタン（黒半透明＋blur）、閉時=幅100%の細バーで「写真を表示」。`aria-label`/`aria-expanded`/`data-tooltip`（`data-tooltip-pos="bottom"`）付き。
- 写真未登録時はプレースホルダ（`min-height: 120px`）で破綻しない。Storage・署名URL取得・cooking_history は引き続き無変更。
- 再 verify pass（lint/typecheck/test 368件/build。verify.json は追補後に再生成済み）。

