---
id: TKT-0157-web-desktop-app-shell
title: PC広画面デスクトップシェル（左サイドバーナビ＋上部バー＋広幅コンテナ）
status: implementation_ready
goal: スマホ表示を完全温存したまま、PC幅で「左サイドバーナビ＋上部バー＋広幅多カラム」の骨格を導入し、以降の各画面を載せる器を用意する
acceptance:
  - 【確定: 案A グループ化ツリー】PC幅（既定 ≥1024px）で左サイドバーが2階層ナビ（セクション見出し＝現3モード＋その配下の葉）として縦並び常時表示される。本チケットでは少なくとも各グループの既定葉が選択でき、グループ見出しクリックで既定葉へ遷移する
  - サイドバー上部に「ホーム」枠、下部に「設定」ギア枠を用意する（中身の実装はそれぞれ TKT-0162 / TKT-0161。本チケットでは枠と遷移ターゲットのみ）
  - PC幅で上部バー（アプリ名／検索スロット／本日のAI残り回数／アカウント・ログアウト）が表示される
  - PC幅でコンテンツ領域が660px固定をやめ、サイドバー＋広幅コンテンツ（最大幅は spec で確定、目安 1200〜1280px）の骨格になる
  - シェルが選択中の (group, leaf) を状態として保持し、各ボードへ「表示すべきサブビュー」を controlled/initial prop として渡せる土台がある（各ボードの配線は TKT-0158/0159/0160 で実施。本チケットでは Shell 側の状態・受け渡し口を用意）
  - PC幅ではコンテンツ内のサブタブ列（`.recipe-subnav` / `.cooking-view-tabs` / 食材の表示切替）をサイドバーに一本化（隠す）方針が spec で確定し、その入口がある
  - スマホ幅（<1024px）では従来どおり下部ナビ（`.bottom-mode-nav`）＋上部ステータスバー（`.canvas-status-bar`）＋中央660px列＋各モード内部タブのまま、見た目・挙動を一切変えない
  - 本日のAI残り回数表示、レシピビューアへの遷移（`requestViewRecipe`）など既存 Shell 機能が PC/スマホ両方で動く
  - 上部バーの検索は骨格（スロット）のみで、機能は TKT-0163 で実装する。未実装でもレイアウトが崩れない
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/app/globals.css
  - web/src/app/page.tsx
  - web/src/__tests__/web-mode-shell.test.tsx
  - project-os/artifacts/TKT-0157-web-desktop-app-shell/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0157-web-desktop-app-shell
related_artifacts:
  - artifacts/TKT-0157-web-desktop-app-shell/verify.json
  - artifacts/TKT-0157-web-desktop-app-shell/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（UIシェルのみ）。Supabase schema / Auth・RLS / 写真Storage / AI route のロジックは変更しない。
  - これは添付モックのデスクトップ化イニシアチブ（TKT-0157〜0163）の土台。TKT-0158〜0162 はこのシェル完成後に着手する（依存）。
  - 【方針の更新（decisions.md 2026-06-03 確定）】TKT-0138 の「PCに広げない」方針は ≥1024px のデスクトップ表示について見直し済み（スマホは温存）。
  - ブレークポイント（既定1024px）とコンテンツ最大幅は spec で確定。既存の `.bottom-mode-nav` / `.canvas-status-bar` / `.app-shell`（660px）はスマホ用に残し、デスクトップ用 class を追加する形にする（既存 class の意味を変えない）。
  - 【IA確定（2026-06-03・案A グループ化ツリー）】サイドバー＝🏠ホーム枠 ＋ 3セクション見出し（食材管理/献立・レシピ/料理・記録）配下に葉（在庫一覧・買い物リスト／レシピ・献立スケジュール／カレンダー・タイムライン・インサイト）＋ 下部ギア＝設定枠。目的地のみ葉にし、アクション（＋追加/AI登録/レシピ生成等）は葉にしない。スマホ=「3モード＋内部タブ」、PC=「3グループ＋葉に展開」で**同一論理ツリーの二面レンダリング**。
  - 【スコープ注意】本イニシアチブの土台として、Shell が選択中の (group, leaf) を保持し各ボードへ controlled/initial prop で渡す「受け渡し口」を本チケットで用意する。各ボードのサブビュー状態の持ち上げ（実配線）と PC でのコンテンツ内タブ非表示は TKT-0158/0159/0160 で行う。当初想定（ガワ差し替えのみ）より範囲が広い点に留意。
  - verify は `/verify TKT-0157`（= `harness/bin/verify_web.sh`）。Canvas版 `app.html` は触らない。対象は `web/` のみ（`supabase/` は触らない）。
  - APIキー・秘密情報を直書きしない。
---

# Summary

PC（広画面）の表示を、添付モックの「左サイドバーナビ＋上部バー＋広幅多カラム」型へ寄せるための**土台（シェル）**を作る。現状PCは `.app-shell { width: min(660px, 100%) }`＋下部タブの「でかいスマホ」レイアウトなので、≥1024px でだけ別シェルへ切り替える。**スマホ表示は完全温存**する。

中身（各画面の多カラム化）は本チケットでは扱わず、TKT-0158〜0160（各モード）/ TKT-0161（設定）/ TKT-0162（ホーム）/ TKT-0163（検索）に分ける。本チケットは「器」だけを用意する。

## 背景

- `web/src/components/web-mode-shell.tsx` が3モード（ingredients/recipes/cooking）を保持し、`.bottom-mode-nav`（下部タブ）と `.canvas-status-bar`（上部の細いステータスバー）を描画している。
- `globals.css` には `.desktop-mode-nav { display: none }`（L303）という**未使用のプレースホルダ**があり、デスクトップナビを足す前提で設計されている。
- パレット（`--accent:#4f46e5` 紫、`--background:#f8fafc`、白カード、角丸8〜12px、淡い影）はモックとほぼ一致しているため、シェルの骨格追加が主作業になる。

## 実装メモ

### 1. デスクトップシェルの描画（`web-mode-shell.tsx`）
- 既存の `modes` モデルと state（`activeMode` ほか）を流用しつつ、**(group, leaf) の選択状態**を追加する。
  - グループ＝現3モード（ingredients/recipes/cooking）。葉＝各モードの内部タブ（在庫一覧・買い物リスト／レシピ・献立スケジュール／カレンダー・タイムライン・インサイト）。葉の定義を Shell 側に持つ。
  - グループ見出しクリックで既定の葉を選択（例: 食材管理→在庫一覧）。約8葉のため常時展開・折りたたみなし。
- デスクトップ用に**左サイドバー（グループ化ツリー）**と**上部バー**を追加描画。表示切替は CSS メディアクエリ。スマホは従来の `.bottom-mode-nav` ＋各モード内部タブのまま。
- サイドバー上部に「ホーム」枠（中身 TKT-0162）、下部に「設定」ギア枠（中身 TKT-0161）を用意（本チケットは枠＋遷移ターゲットのみ）。
- 上部バーに入れる要素: アプリ名/ロゴ、**検索スロット**（中身は TKT-0163、ここでは空のプレースホルダ）、`<AiUsageMeter variant="statusbar" summary={aiUsageSummary} />`、アカウント（`userEmail`）＋ログアウト導線。
- 既存の `ShellStatusContext`（`aiUsageSummary` / `requestViewRecipe` / `returnToMode` など）は不変。選択中の葉を各ボードへ渡す「受け渡し口」（context 追加 or props）を用意する（実配線は各モードチケット）。

### 1b. サブビュー受け渡しの土台（本チケットの肝）
- 各ボード（`InventoryBoard` / `RecipeMealWorkspace` / `CookingHistoryBoard`）は内部に自前のタブ state を持つ。これを Shell から動かせるよう、**controlled もしくは initial の prop で「表示すべきサブビュー」を受け取れる口**を本チケットで定義する（型・prop 名を確定）。
- 実際に各ボードの内部 state を持ち上げ、PC でコンテンツ内タブ（`.recipe-subnav` / `.cooking-view-tabs` / 食材の表示切替）を隠す配線は TKT-0158/0159/0160 で行う。本チケットは口の定義と Shell 側状態まで。

### 2. コンテナの広幅化（`page.tsx` / `globals.css`）
- スマホ: `.app-shell { width: min(660px, 100%) }` を維持。
- デスクトップ（≥1024px）: サイドバー（固定幅 目安 220〜260px）＋コンテンツ（最大幅 目安 1200〜1280px）の2カラムへ。`.app-shell` の意味を変えず、ラッパ class（例 `.desktop-app-frame`）を追加して出し分ける。
- `.bottom-mode-nav` はデスクトップで非表示、`.desktop-mode-nav`（サイドバー）はデスクトップでのみ表示。`.canvas-status-bar` はスマホ用、上部バーはデスクトップ用に整理する。

### 3. テスト（`web-mode-shell.test.tsx`）
- サイドバーのグループ見出し／葉の表示と、葉の選択でその葉が選択状態になること、グループ見出しクリックで既定葉へ行くこと、AI残り回数が描画されること、検索スロットが存在すること等の最小テストを追加・更新する。
- DOM出し分けの方針（重複描画 or 単一描画）に応じて既存テストのセレクタを調整する。

### 共通方針
- 既存のコード規約・命名・import エイリアス（`@/`）・immutable patterns に合わせる。console.log を残さない。
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキー・秘密情報は直書きしない。

## 残リスク

- スマホ用の既存 class（`.app-shell` 660px / `.bottom-mode-nav` / `.canvas-status-bar`）と各モード内部タブを壊さないこと。デスクトップ用 class を追加する方針で副作用を抑える。
- **サブビュー受け渡しの設計**（葉の型・prop 名・controlled/initial の方式）を本チケットで適切に決めないと、TKT-0158/0159/0160 の配線が割れる。ここが本チケットの設計上の肝。
- 同一要素をPC/スマホで二重描画するとアクセシビリティ（重複ランドマーク）に注意。`aria` と表示制御を spec で確定する。
- ブレークポイント境界（タブレット ~768〜1024px）の見え方は spec で定義し、実機目視は別途。
