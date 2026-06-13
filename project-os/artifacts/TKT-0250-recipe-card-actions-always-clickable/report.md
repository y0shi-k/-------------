# TKT-0250 report

## 結論

PC幅のレシピカードで、写真エリア右上の操作ボタンが一瞬で消えて押せない問題を修正した。

2026-06-13追補: 初回修正は通常時も薄く表示する形にしてしまい、ユーザー要望（通常は非表示、カードhoverで表示して押せる）とずれていたため再修正した。

## 原因

`@media (min-width: 1024px)` 内の `.recipe-card .recipe-card-actions` が、通常時 `opacity: 0; pointer-events: none;` になっていた。

そのためカードの hover / focus が切れた瞬間に、操作ボタンが非表示かつクリック不可になっていた。

また `.recipe-card:hover` で `transform: translateY(-2px)` していたため、カード上端付近ではhover境界が動き、操作ボタンへ向かう途中でhoverが切れる可能性があった。

さらに写真ボタンは `data-tooltip` を持つため、hover中に汎用ツールチップの安全装置で `z-index: 111` へ上がる。操作ボタン側に `z-index` が無いと、写真ボタンが前面に出て操作ボタンを覆い、表示されても押せない可能性があった。

## 変更内容

- `web/src/app/globals.css`
  - PC幅の `.recipe-card .recipe-card-actions` は通常時 `opacity: 0; pointer-events: none;` に戻した。
  - `.recipe-card:hover` / `.recipe-card:focus-within` 時だけ `opacity: 1; pointer-events: auto;` にして、表示中はクリック可能にした。
  - `.recipe-card:hover` の `transform: translateY(-2px)` を削除し、hover中にカード位置が動いて判定が切れる可能性を避けた。
  - `.recipe-card .recipe-card-actions` に `z-index: 120` を追加し、写真ボタンの `data-tooltip:hover` レイヤーより前面に出るようにした。

## 影響範囲

- CSSのみ変更。
- JSX、保存形式、DB schema、Supabase Auth/RLS、Storage、AI API route は変更なし。
- Canvas版 `app.html` は変更なし。

## 検証

- `harness/bin/verify_web.sh TKT-0250-recipe-card-actions-always-clickable`: pass（2026-06-13T15:16:18+09:00）
  - lint: pass（既存warning 6件あり、errorなし）
  - typecheck: pass
  - test: pass（51 files / 566 tests）
  - build: pass
  - policy: no GAS dependency / no hardcoded secret / Supabase RLS present / backlog focus lean all pass

## ブラウザ確認メモ

- 開発サーバー: `http://localhost:3001`
- in-app Browser で開いたところ `/login` にリダイレクトされたため、実データのレシピカード目視までは未実施。
- 対象変更はCSSのみで、verifyとbuildは通過済み。

## 残メモ

- 初回と2回目のverifyでは `next build` の `.next` 出力参照が一時的に失敗したが、単体 `npm run build` と再実行verifyではpassした。
- 既存テスト内で同一 `schedule-1` key のReact warningが出ているが、今回のCSS修正とは別件。
