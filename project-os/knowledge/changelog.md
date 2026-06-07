# Changelog（完了チケットの1行ログ）

> 完了した TKT を**1行ずつ**記録する追記専用ログ。新しいものを上に足す。
> 詳細の正本は各 `project-os/artifacts/<TKT>/report.md`（と `tickets/completed/`）。ここには概要だけ置く。
> `/finalize` が完了時にここへ1行追記し、`backlog.md` の「現在のフォーカス」からは当該行を消す。
> 「現在のフォーカス」は進行中のみを置く場所。完了サマリをそこに残さない（肥大化防止）。

## 2026-06

- TKT-0204 — レシピ/食材/料理写真候補の署名URL取得を共有キャッシュ（TKT-0203）経由に統一（`use-recipe-image-urls`/`use-cooking-photo-candidates` を `getCachedUserImageSignedUrl` に差し替え、`inventory-board` の自前 effect を共有フック `useCachedSignedUrls` に置換、画像差し替え/削除フローに `invalidateUserImageSignedUrl` 追加）。再マウントで同一URLを返しブラウザ画像キャッシュをヒットさせ再DLを解消。読み取り専用＝公開設定/RLS/Storage無変更（photo_upload_storage/supabase_schema_change/auth_and_rls_policy は語彙の過剰マッチ／report に静的記録）。残: DevTools Network でモード往復の disk/memory cache ヒットと差し替え後の旧画像非表示の手動確認。
- TKT-0203 — 画像署名URLの共有キャッシュ基盤 `web/src/lib/photos/signed-url-cache.ts` 新設（path→{url,expiresAt} の module キャッシュ＋満了5分前マージン再発行＋in-flight Promise dedup＋`getCachedUserImageSignedUrl`/`invalidateUserImageSignedUrl`/共有フック `useCachedSignedUrls`、vitest 5件）。既存 `createUserImageSignedUrl`/TTL をラップする薄い層で表示箇所は無変更（差し替えは TKT-0204）。読み取り専用＝Storage/RLS/auth無変更（photo_upload_storage は語彙の過剰マッチ／report に静的記録）。
- TKT-0201 — 全画面ビューの材料・調味料サブグルーピングUI（行クリック＋Cmd/Ctrl複数選択→ラベル隣「グルーピング」で同一 item_type 内に `group_index` 付与、サブグループ見出し「解除」/選択行「グループ解除」で 0 へ戻す、見出し自動採番=材料A/B/C・調味料あ/い/う、D&Dはドロップ先の group_index 継承、`sameIngredientOrder` に group_index 比較追加で位置不変でも確定有効化）。保存は `recipe_ingredients` の item_type/sort_order/group_index 更新に限定＝schema変更なし（supabase_schema_change は語彙の過剰マッチ／report・manual-smokes に静的記録）。残: 実機375pxでのサブグループ枠・選択/D&D共存の目視。
- TKT-0200 — 材料・調味料サブグループのDB土台（`recipe_ingredients.group_index` 0=未グループ追加＝危険変更/supabase_schema_change、`check(group_index>=0)`、型・取得順`item_type,group_index,sort_order`・保存ペイロード対応。UI未実装＝常に0保存で挙動不変、policy/RLS無変更）。残: リモートmigration適用と適用後のRLSライブ確認（manual-smokes.md 手順あり）。
- TKT-0199 — 全画面ビュー「並び替えを確定」に確認を追加（保存前に `requestDelete`/`DeleteConfirmPanel` を流用した確認、OK時のみ既存 `saveCookingReorder` 実行・やめるで未確定保持）。並び替えロジック・保存対象カラム無変更。残: 実機での文言・操作感確認。
- TKT-0198 — レシピ編集モーダルの材料・調味料を3本線ハンドルD&D並び替え（`moveIngredient` で immutable 入替・同一 item_type 内限定、保存は既存 `saveRecipe`→`sort_order` 採番流用）。schema/新規DB書き込み無変更。残: 実機スマホでのD&D操作感確認。
- TKT-0186 — 主要操作ボタンの sticky 固定。食材管理ヘッダーの「＋」(スマホ sticky/PC static)・手動追加モーダルの「在庫に追加」(`.form-actions` sticky bottom)・全モーダルの「×」(`.modal-close-button` を absolute→sticky top:14px+grid右上、`margin-bottom:-40px` で見た目維持)。実差分は globals.css のみ（schema/Storage 無変更）。残: 実機/DevTools 375px 目視。
- TKT-0185 — 食材管理の食材名行の文字重なり修正。`.item-title-row`(flex)の子 `h4` に `min-width:0` を補い flex 縮小＋ellipsis を機能させ、スマホは `@media(max-width:719px)` で `.stock-item` を3列grid-areas再定義＋`h4` nowrap/ellipsis 化（チップと重ならない）。実差分は globals.css のみ（schema/Storage 無変更）。残: 実機/DevTools 375px 目視。
- TKT-0184 — スマホ横はみ出しの一掃（土台）。globals.css 末尾に `@media (max-width: 719px)` を追記し `.consumption-row-controls`(min-width220px解除)/`.cooking-filter-row`(5→2列)/`.conversion-row`(2列折返し・モーダル内は維持)/各種グリッド列数を緩和＋`body overflow-x:hidden` 保険。実差分は globals.css のみ（schema/Storage 無変更／eval過剰マッチはreport記録）。残: 実機/DevTools 375px 目視。
- TKT-0188 — 料理記録 編集モーダルの写真UI改善（既存写真をサムネ右上×で確認なし削除予定化＝実削除は確定時・キャンセルで残る・「削除予定N件（元に戻す）」で救済、新規写真はファイル名→サムネ表示＋×取り消し、objectURLは useEffect クリーンアップで解放）。実差分は Storage/schema 無変更（既存削除/追加経路の再利用）。残: 実機での削除/復元・サムネ・スマホ幅目視。
- TKT-0183 — 料理完成写真2エリア（調理完了フローの料理記録パネル／料理記録の編集モーダル・複数対応）へファイルD&D登録＋Ctrl+V貼り付け（TKT-0187整合の追補）を適用（共通フック `useImageFileDrop` の `pasteAreaProps`/`isActive` も再利用、`handleNewPhotosChange` を `addNewPhotos(File[])` に分離、ハイライト/アクティブCSS追加）。実差分は Storage/schema 無変更（既存圧縮・`photos` 登録経路の再利用）。残: 実機でのPCドロップ/貼り付け目視。
- TKT-0187 — 画像エリアのクリックフォーカス＋クリップボード貼り付け（Ctrl+V）対応（共通フック `useImageFileDrop` に `onPaste`/フォーカス管理を追加・アクティブ時のみ貼り付け＝ページ全体のCtrl+Vを奪わない・既存画像の差し替えも対応）。実差分は Storage/schema 無変更。残: 実機での Ctrl+V 貼り付け目視。
- TKT-0176 — 食材画像の登録・差し替え・削除UI（同名食材の記憶／`user_ingredient_images` 新設・個別在庫画像優先の表示順）。危険変更（photo_upload_storage/auth_and_rls_policy）。残: 実機スモーク（圧縮品質・スマホUI・クロスユーザー拒否）。
- TKT-0177 — AI構造化でURL込み本文のリンク消失を修正（AIのsource優先＋structureで空なら本文から `https?://` 正規表現抽出のフォールバック、共通部品 `RecipeSourceLinks`）。残: 実機での貼付→保存→リンク表示の目視。
- TKT-0175 — 食材標準画像カタログ（自作SVG標準アイコン＋表記ゆれ吸収 resolver、未対応食材は絵文字フォールバック）。
- TKT-0174 — レシピ画像の登録・差し替え・削除UI（4:3/1280px/WebP圧縮で非公開Storage保存・DBはpathのみ・表示優先順位統一）。危険変更（photo_upload_storage/schema）。残: 実機スモーク（圧縮品質・スマホUI・クロスユーザー拒否）。
- TKT-0173 — ユーザー登録画像のDB列 `image_storage_path` ＋非公開 `photos` バケット流用・本人領域限定policy。
- TKT-0169 — ホームのビジュアル刷新（`HomeHero`＋おすすめ写真カード、画像ゼロでも崩れないフォールバック）。残: 実機目視・実画像配置後の見栄え。
- TKT-0167 — レシピお気に入り `recipes.is_favorite` 新設（schema+RLS＝危険変更、hosted へ `db push` 適用済み）。残: UI happy-path確認。
- TKT-0166 — PCレシピカード縦型化（プレースホルダ＋名前2行クランプ＋操作ボタンをホバー退避）。残: 実機目視。
- TKT-0165 — PC献立スケジュールを縦アジェンダ表示へ差し戻し（死に余白解消、CSSのみ）。残: 実機目視。
- TKT-0164 — 完了モーダル（ConsumptionEditor）のUI簡素化・1行高密度化（除外は消費量0へ一本化）。残: 実機スモーク。
- TKT-0162 — PCホーム/ダッシュボード新設（サマリー4枚＋`TodayDashboard`、PCのみ初期表示）。残: UI happy-path確認。※これで TKT-0157〜0162（PCデスクトップUI化）の主要チケット完了。
- TKT-0161 — 散在設定を設定画面（`settings-panel.tsx`）へ集約（Gemini APIキー/AI残量/ログアウト）。残: 実機スモーク（設定遷移・キー保存→AI実行・ログアウト）。
- TKT-0160 — 料理・記録のPC多カラム化（内部タブ持ち上げ・タイムライン複数カラム・カレンダー拡大）。残: 実機目視。
- TKT-0156 — 消費量調整画面で調味料が分類されない不具合修正（在庫category→レシピ材料 `item_type` 由来へ統一＋AI分類指示）。残: 実機目視・既存AI生成レシピの再分類要否。
- TKT-0155 — レシピ編集モーダルの材料行レイアウト改善（モーダル720px化＋単位列拡大＋nowrap、CSSのみ）。残: 手元dev目視。
- デザイン正本 — `docs/design/pc-design-language.md` 新設（PC幅トーンを Image #3＝indigo+白基調に統一。デザイントークン＋コンポーネント規定）。
