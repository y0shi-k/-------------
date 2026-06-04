---
ticket_id: TKT-0162-web-desktop-home-dashboard
status: ready
---

# Report Draft

## 変更目的

PCデスクトップUI化イニシアチブ（案A・decisions.md 2026-06-03 確定）の最終ピースとして、
PC向けのホーム/ダッシュボード（「ようこそ」広画面ランディング）を新設した。

TKT-0157 のデスクトップシェルには既に「ホーム」ボタンと `activeDesktopTarget: { kind: "home" }` 状態が
用意されていたが、home を選んでも描画する中身が無く（コンテンツ領域は常にモード画面を描画）、
ホームは実質未実装だった。本チケットでその空きスロットに、挨拶＋サマリーカード（既存カウント）＋
今日の確認（今日の献立・在庫アラート・買い物・レシピ候補）を集約したランディングを実装した。

**既存データの集約表示のみ**で、新規DBクエリ・新規データソースは増やしていない（非危険変更）。

## 今回追加した安全装置

- 新規データ取得・新規 Supabase クエリを追加していない。ホームに渡すデータは page.tsx が既に取得済みの
  `inventoryItems / cookCandidates / mealSchedules / shoppingItems` と既存集計カウントの再利用のみ。
  → APIキー・写真URL・Service Role Key を新たにブラウザへ出す経路は増えていない。
- 既存の `TodayDashboard`（今日の確認）をそのまま埋め込み、期限判定等のロジックを複製していない。
- PC初期表示=ホームは、SSR/ハイドレーション不整合とスマホ初期表示の誤発火を避けるため、
  初期 state は従来どおり ingredients に据え置き、マウント後に `window.matchMedia("(min-width: 1024px)")`
  が真のときだけ home へ昇格する方式にした。スマホ（<1024px）は昇格せず食材管理起点・下部タブ3つ据え置き。

## 実施した確認

- `/verify TKT-0162` … lint / typecheck / test / build すべて pass。
  policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）すべて pass。
  → `project-os/artifacts/TKT-0162/verify.json`（status=pass）。
- ユニットテスト追加・実行（pass）:
  - `web/src/__tests__/web-mode-shell.test.tsx`: ①matchMedia=desktop で初回ホーム表示・モードボード非描画、
    ②ホームボタンクリックでホーム表示。既存11件も回帰なし。
  - `web/src/__tests__/home-dashboard.test.tsx`: サマリーカウント表示、カードクリックで `selectShellLeaf`
    が該当 (group, leaf) を呼ぶこと。
- `/check-gates TKT-0162`: `supabase_schema_change` 🔴 が点灯するが、これは `diff_regex_any` の
  テーブル名トークン（`recipes` / `cooking_history`(photos) 等）が TypeScript 識別子・既存語に
  過剰マッチしたもの。実際の `create table`/`alter table`/`create policy` は無く、schema/RLS/Storage は
  一切変更していない（TKT-0160/0166 と同種の散文由来の過剰マッチ）。詳細は review.md / manual-smokes.md を参照。

## 残リスク

- ブラウザでの目視確認が残課題:
  - PC幅（≥1024px）で初回ホーム表示・挨拶＋件数4カード＋今日の確認の表示、サマリーカードからの遷移。
  - スマホ幅（<1024px）で初回が食材管理・ホーム非表示・下部タブ3つ維持。
- PCでマウント後に ingredients→home の一瞬の切替が出得る（matchMedia 昇格方式のトレードオフ）。
  気になる場合は `useLayoutEffect` 化で軽減可能。
- 「ようこそ」モックの細部（写真付きレシピ候補カード等）は既存データで埋まらない要素を飾りで足さない方針のため未実装。

## 次の依頼や人判断

- 手元 dev（`web/` で `npm run dev`）での上記目視確認。
- ホームの視覚デザイン強化（写真・絵文字アイコン等）は後続の TKT-0168〜0172（visual layer）系で扱う想定。
