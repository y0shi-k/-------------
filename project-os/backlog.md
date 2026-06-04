# Backlog（マクロ層: 今 / 次 / 優先順位）

> 「現在のフォーカス」と「次にやる候補」の live な正本。短く保つ。詳細はチケットへ。
> 長期ロードマップは `project-os/knowledge/phase-map.md`、決定経緯は `decisions.md` を参照。
> 着手時にここの「次」を見て `/new-ticket` する。完了時に `/finalize` がここを更新する。

## 現在のフォーカス
- 公開前セキュリティ整備（TKT-0149/0150/0151）が一段落。次は本番Supabase/Vercelへの適用・手動確認。
- (TKT-0154) 数量・単位入力のUX改善（単位ピッカー／単位換算の上単位連動／数量スピン1刻み／数値欄IMEオフ）。spec_ready・実装はCodexで実施予定。
- (TKT-0155) 完了。レシピ編集モーダルの材料行レイアウト改善（TKT-0154の単位ピッカーが64px列で縦積み崩れ→モーダル720px化＋単位列拡大＋nowrap化、CSSのみ）。verify pass。目視確認は手元dev推奨。
- (TKT-0156) 完了。消費量調整画面で調味料が分類されない不具合の修正。原因①履歴編集が在庫categoryで分類→レシピ材料 item_type 由来へ統一（完了画面と一致）。原因②AI生成プロンプトに調味料分類指示を追加。スキーマ変更なし。verify pass・全gate閉。実機目視と既存AI生成レシピの再分類（データ移行要否）は残課題。
- (TKT-0164) 完了。完了モーダル（実際の消費量を調整 / ConsumptionEditor）のUI簡素化・1行高密度化。除外を「消費量0」だけに一本化（チェックボックスと「減算しない」option廃止）、材料名＋在庫select＋消費量(+単位)を横一列＋NumberField化。料理履歴編集モーダルは固有の在庫差分意味があり無改変（別チケット候補）。verify pass・全gate閉。実機スモークと編集モーダルの見た目統一は残課題。
- (TKT-0165) 完了。PC幅の献立スケジュールを TKT-0159 の7列横並びから「1日=1行」の縦アジェンダ表示へ戻した（各日カードが盤面全高まで伸びてスロット下に死に余白が出る問題を解消）。CSSのみ（globals.css 1024pxブロック）、`.schedule-board` を max760px中央寄せに制限。verify pass・危険evalなし。実機目視と最大幅の好みは残課題。
- (デザイン正本) `docs/design/pc-design-language.md` を新設。PC幅のトーンを Image #3（indigo+白基調・余白広め）に統一する設計正本。デザイントークン（--accent-soft/--favorite/--shadow-card）＋コンポーネント規定。今後のPC各画面はこれに収束させる。
- (TKT-0166) 完了。PCレシピカードを縦型へ刷新（上部プレースホルダ＋名前2行クランプ＋操作ボタンをホバー退避＋タグ折り返し）。トークン土台を :root に追加。CSS+1行JSXのみ、スマホ温存。verify pass・全gate閉（check-gatesの🔴危険は散文由来の過剰マッチと記録）。実機目視は残課題。
- (TKT-0160) 完了。料理・記録のPC多カラム化。`useShellSubView` で `selectedSubViews.cooking→historyView` を同期しPCで内部タブ（`.cooking-view-tabs`）を非表示、タブonClickを `selectShellLeaf("cooking",view)` 経由に（recipe/inventory と同形）。CSSはタイムライン複数カラム（auto-fill minmax320）・カレンダーセル/サムネ拡大（72→110/34→60px）・インサイト広幅化を1024pxブロックに追加。スマホ温存。verify pass・全gate閉（🔴 photo/schema eval は写真語彙とテストfixtureによる過剰マッチと記録、実ロジック無変更）。実機目視は残課題。
- (TKT-0161) 完了。散在設定（Gemini APIキー入力・AI残り回数・アカウント/ログアウト）をPC=サイドバー下部ギア／スマホ=ステータスバーのアカウントタップから開く設定画面（`settings-panel.tsx` 新設）へ集約。TKT-0157配線済みの `activeDesktopTarget.kind==="settings"` の描画先を実装。APIキー入力は設定へ移設しボード内4箇所撤去、ボードはマウント時 `loadUserGeminiApiKey()` でキー読込を代替（旧パネルのuseEffect依存を補完）、未入力エラー文を「設定画面で登録」に更新。AI残量メーターは上部バー＋設定に集約しボード内4箇所撤去。ログアウトは設定に新設＋PC上部バー据え置き。認証・キー保存ロジック不変。verify pass・全gate閉（🔴 schema/photo eval は changed_paths 過剰マッチ、実ロジック無変更）。**実機ブラウザの目視スモーク（設定遷移・APIキー保存→AI実行・ログアウト・スマホ全画面化）はユーザー残課題**。`.photo-empty` 旧文言は据え置き（軽微）。
- (TKT-0167) 完了。レシピお気に入り `recipes.is_favorite`（boolean not null default false）を新設（危険変更=schema+RLS）。縦型カードにハート（楽観的更新＋失敗ロールバック・トグル専用更新で saveRecipe と分離）、絞り込みに「お気に入り」チップ追加。既存行ポリシー（auth.uid()=user_id）で充足し新規RLSなし。Docker未導入でローカルSupabase不可のため、ユーザー承認のうえ hosted（wwtompvneobysieofxkl）へ `supabase db push` 適用し schema/RLS/後方互換を hosted で実検証。verify pass・全gate閉。**UI happy-path（保存・絞り込み・モバイル・ハート見た目）のブラウザ確認はユーザー残課題**。ハートSVGは非対称崩れを対称パスへ修正済み。
- (TKT-0169) 完了。ホームのビジュアル刷新（TKT-0168基盤ドリブン）。ヒーローを `HomeHero` 化し `/images/hero/home-hero.webp` を onError 付きで読み、無ければ従来テキストヒーローへフォールバック（テキスト常時表示で画像ゼロでも崩れない）。「最近作ったレシピ／無ければお気に入り」を既存 `recipes`（page.tsx で取得済み・新規クエリなし）から `pickFeaturedRecipes` で選び `<RecipeThumb size="card">` の写真カードで表示（対象ゼロなら枠を出さない）。各カードは `selectShellLeaf("recipes","recipes")` で遷移。サマリー4枚＋`TodayDashboard` は維持。CSSは `.home-hero` flex化＋`.home-feature*` 追加（PC3列）、`:root` 追加なし、スマホ温存。テスト3件追加。verify pass・全gate閉（🔴 supabase_schema_change/photo_upload_storage は散文・命名の過剰マッチ＝review/manual-smokes に静的確認記録）。**実機目視（PC feature 3列・ヒーロー・スマホ回帰）と実画像配置後の見栄えはユーザー残課題（TKT-0172後）**。
- (TKT-0162) 完了。PCホーム/ダッシュボード新設（案A・PCデスクトップUI化の最終ピース）。挨拶＋サマリーカード4枚（既存カウント、クリックで該当モードへ `selectShellLeaf`）＋既存 `TodayDashboard`（今日の確認）を集約。ホームの中身は page.tsx で組み立て `home` ReactNode として WebModeShell へ渡す設計（shell はデータ非依存）。PC初期表示=ホームは初期 state を ingredients 据え置き＋マウント後 `matchMedia(≥1024px)` で home へ昇格（スマホは食材管理起点・下部タブ3つ据え置き、jsdom 未定義で既存テストも無改変通過）。新規DBクエリ・新規データソースなし＝非危険変更。新規 `home-dashboard.tsx`＋web-mode-shell の描画分岐/トップバー/matchMedia 昇格、CSS、テスト4件追加。verify pass・全gate閉（🔴 supabase_schema_change はテーブル名トークンの過剰マッチ、実 schema/RLS/Storage 無変更＝review/manual-smokes に静的確認記録）。**UI happy-path（PC初回ホーム・カード遷移、スマホ食材管理起点・ホーム非表示）のブラウザ確認はユーザー残課題**。これで TKT-0157〜0162（PCデスクトップUI化）の主要チケットは完了。

## 次にやる候補（優先度つき・要ユーザー確認）
0b. (PCデザイン刷新・design正本ドリブン) `docs/design/pc-design-language.md` のトーン（Image #3）へPC各画面を収束させる。①TKT-0166（レシピカード縦型化）=完了。②TKT-0167（お気に入り is_favorite 新設・schema=危険変更）=完了（hosted適用済み・UI目視はユーザー残）。③**献立スケジュールの配色トーン統一（sky-blue抑制）=次の候補**。④在庫/料理記録/設定/ホームの順次トーン統一。各ステップ独立チケット、危険変更（0167）は分離。
0a. (新規イニシアチブ・2026-06-04) **ビジュアルレイヤー導入**（参考モック `レシピイメージ図` の写真・絵文字に寄せる）。ホームがテキスト主体で参考図と程遠い件への対応。方針=**レイアウト先行＋6画面まとめて**（ユーザー確定）。写真は当面 `web/public/` 静的デモ画像（schema/Storage変更なし）、食材は絵文字、画像はCodex生成。設計正本に §8 追記済み（`docs/design/pc-design-language.md`）＋発注書 `docs/design/demo-image-assets.md` 新設。5チケット（依存順）:
   - **TKT-0168（基盤・統一の要／0169-0172の前提）**: `recipe-image.ts`（名前→静的画像resolver）/ `ingredient-emoji.ts` / `<RecipeThumb>` / `<IngredientIcon>` ＋CSS＋正本§8。← これを先に完了させる。
   - TKT-0169（ホーム刷新: おすすめ写真カード＋ヒーロー＋今日の確認の視覚化）。
   - TKT-0170（食材の絵文字化: 在庫一覧＋AI食材登録の認識結果）。
   - TKT-0171（レシピ写真化: 一覧カード＋詳細ヒーロー＋提案サムネ。TKT-0166のプレースホルダに差し込む）。
   - TKT-0172（Codex生成画像の配置＋デモシード。実画像で最終見栄え確認。schema/Storage変更なし）。
   - 全て非危険変更（CSS/JSX/静的アセット）。`photo_upload_storage`/`ai_server_route`/`csv_import_migration` eval は語彙で過剰マッチするが実Storage/schema/移行は無変更（report に記録）。設定画面は画像不要＝対象外（TKT-0161完了済み）。
0. (新規イニシアチブ) PCデスクトップUI化（添付モック準拠: 左サイドバー＋上部バー＋多カラム、スマホは温存）。7チケット＋IA確定済み（decisions.md 2026-06-03）:
   - サイドバーIA=案A グループ化ツリー: 🏠ホーム / [食材管理: 在庫一覧・買い物リスト] / [献立・レシピ: レシピ・献立スケジュール] / [料理・記録: カレンダー・タイムライン・インサイト] / ⚙設定。スマホ=「3モード＋内部タブ」と同一論理ツリーの別レンダリング。目的地のみ葉、アクションは葉にしない。
   - 土台: TKT-0157（デスクトップシェル＝グループ化ツリーナビ＋(group,leaf)状態＋サブビュー受け渡し口）← これが完了しないと TKT-0158〜0162 に着手しない（依存）。当初のガワ差し替えより範囲広め。
   - 各モード多カラム化＋サブビュー持ち上げ: TKT-0158（食材管理）/ TKT-0159（献立・レシピ。※スケジュールのPC7列ウィークグリッドは下部余白が無駄だったため TKT-0165 で縦アジェンダ表示へ差し戻し済み）/ TKT-0160（料理・記録: カレンダーは月グリッドのまま拡大）。各ボードの内部タブ state を持ち上げ、PCでコンテンツ内タブを隠す。
   - 拡張: TKT-0161（設定: 案A=サイドバー下部ギア＋スマホ導線、主ナビ非昇格）=完了。/ TKT-0162（ホーム: 案A=新設・PCのみ初期表示、今日の献立をホームに集約）=次の候補。
   - 任意（P低）: TKT-0163（上部バー横断検索の機能化）。
   - 注意: 先行の TKT-0138「PCに広げない」方針は、≥1024px のデスクトップ表示について見直し済み（モバイル温存）。
1. (P1) 公開前の本番適用ゲート — Supabase Dashboard Auth設定（TKT-0149）、`ai_usage_events` migration適用（TKT-0151 `supabase db push`）、実DB/実機での手動スモーク。
2. (P2) 横断リスク対応 — 緩いCSP（`unsafe-inline`/`unsafe-eval`）× localStorageのGeminiキー保存（XSS時の鍵流出）。CSP nonce化 or sessionStorageオプションを別チケットで検討。
3. (P2) 画像スキャンからのAI一括登録（参照: phase-map「画像スキャン」, TKT-0003系）。
4. (P3) `ai_usage_events` の古い行の定期削除（保全）。
5. (P3) Canvas版CSV → Supabase 移行（危険変更: `csv_import_migration`）。

> 上記の並びは仮。実際の優先順位はユーザーが確定する。

## 保留 / 却下
- （なし。却下の理由は decisions.md に残す）
