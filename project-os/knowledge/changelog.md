# Changelog（完了チケットの1行ログ）

> 完了した TKT を**1行ずつ**記録する追記専用ログ。新しいものを上に足す。
> 詳細の正本は各 `project-os/artifacts/<TKT>/report.md`（と `tickets/completed/`）。ここには概要だけ置く。
> `/finalize` が完了時にここへ1行追記し、`backlog.md` の「現在のフォーカス」からは当該行を消す。
> 「現在のフォーカス」は進行中のみを置く場所。完了サマリをそこに残さない（肥大化防止）。

## 2026-06

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
