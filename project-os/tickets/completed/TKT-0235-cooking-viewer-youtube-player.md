---
id: TKT-0235-cooking-viewer-youtube-player
title: 調理ビューア写真エリアに写真⇔動画切替＋YouTubeインライン再生を追加
status: completed
goal: レシピ参考元がYouTubeのとき別タブでしか動画を見られず、調理中にアプリと動画を往復する不便を防ぐ。
acceptance:
  - source に YouTube URL を含むレシピで調理ビューアを開くと、写真エリア（cooking-pane-photo）に YouTube プレイヤー（iframe）が初期表示される
  - 同レシピに写真もある場合、写真エリアに「写真/動画」切替UIが表示され、切替で写真⇔動画を行き来できる（選択状態が視覚的に分かる）
  - YouTube URL が無いレシピでは切替UIが表示されず、従来どおり写真（未登録時はプレースホルダ）のみ表示される
  - iframe は `https://www.youtube-nocookie.com/embed/<videoId>` を src とし、autoplay しない。`title` 属性と `allowFullScreen` を持つ
  - videoId は TKT-0234 の `web/src/lib/youtube.ts` のヘルパーで `recipe.source` から取得する（source の先頭側で最初に取れた動画を採用）
  - 既存の「▲ 写真を隠す」開閉トグル（TKT-0219）と共存し、閉じると写真も動画も畳まれる。開閉・切替でレイアウト崩れ・横スクロールが発生しない（PC幅・スマホ375px幅）
  - 動画表示中も iframe が写真エリアの枠（既存の RecipeThumb hero 相当の領域）に収まり、16:9 で表示される
  - 調理ビューアを別レシピで開き直すと、切替状態が新しいレシピの初期状態（YouTubeあり=動画）にリセットされる
  - 既存のヘッダー participant（戻る/スケジュール追加/編集）・材料/手順表示・調理完成写真（cooking_history）の動作は変わらない
  - コンポーネントテスト（YouTubeあり=動画初期表示＋切替可、YouTubeなし=切替UI非表示）が追加され通る
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0235/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0226-cooking-viewer-youtube
  - SPEC-0124-cooking-viewer-web
related_artifacts:
  - artifacts/TKT-0235/verify.json
  - artifacts/TKT-0235/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0235`。コマンドの正本は `harness/registry.json`
  - 非危険変更（表示のみ）。写真は既存の署名付きURL（recipeImageUrls）再利用で、Storage/schema/auth/AI route/CSV は一切変更しない
  - `/check-gates` が diff の「写真/photo/image」語で photo_upload_storage（danger）を過剰マッチさせる可能性があるが、本チケットは表示のみ。report に実Storage無変更を明記する既存運用に従う
  - 先行依存: TKT-0234（youtube.ts ユーティリティ＋CSP frame-src）。未完了なら着手しない（iframe が CSP でブロックされ目視確認できないため）
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

調理ビューアの写真エリア（TKT-0219 で導入した `cooking-pane-photo`）に、YouTube URL を持つレシピ向けの「写真⇔動画」切替と YouTube インライン再生を追加する。ユーザー決定: 両方あるレシピは**動画を初期表示**、切替で写真に戻せる。

## 参照すべき既存実装

- `web/src/components/recipe-meal-workspace.tsx`
  - `CookingViewer`（4129行付近〜）と写真エリア JSX `cooking-pane-photo`（4424-4444行）。`isPhotoOpen && <RecipeThumb ... size="hero" />` ＋ 開閉トグルボタンの構造。ここに media 切替を足す。
  - 開閉 state: `isCookingPhotoOpen`（551行、初期 true）と `onTogglePhoto`（2719行）。親（RecipeMealWorkspace）が持ち props で渡す構成。切替 state も同じ持ち方に揃えるのが自然。
  - `RecipeSourceLinks`（4833-4856行）… `recipe.source` を改行 split して URL 判定している現仕様。動画URLの取得元はこの `source`。
  - `imageUrl` prop は `recipeImageUrls.get(activeCookingRecipe.id) ?? null`（2704-2728行の呼び出し）。
- `web/src/lib/youtube.ts`（TKT-0234 成果物）… `recipe.source` から videoId を取るヘルパー。判定ロジックをコンポーネント内に再実装しないこと。
- `web/src/app/globals.css` … `.cooking-pane-photo[data-open=...]` のスタイル（3367-3432行付近、TKT-0219）。切替ボタン・iframe 用スタイルをここに追加。
- `web/src/__tests__/recipe-meal-workspace.test.tsx` … `renderWorkspace` ヘルパー（134-143行）。`baseRecipe` の `source` に YouTube URL を入れたケースを足す。

## 実装メモ

- 切替 state（例 `cookingMediaTab: "video" | "photo"`）は `isCookingPhotoOpen` と同様に親で持つ。`activeCookingRecipeId` が変わったら初期値（YouTubeあり=video）へリセットすること（`openCookingViewer` 1033行付近での set が既存パターン）。state 更新はイミュータブルに。
- videoId は `CookingViewer` 内で `useMemo`（または親で算出して props）で `recipe.source` から1回だけ計算する。
- iframe には `title={recipe.name + " の参考動画"}` 相当・`allowFullScreen`・`allow="encrypted-media; picture-in-picture"` を付ける。`sandbox` は YouTube プレイヤーが動かなくなるため使わない。autoplay パラメータは付けない。
- 16:9 維持は CSS `aspect-ratio: 16 / 9`（既存 globals.css の書式に合わせる）。写真エリアの既存高さと大きくズレないよう、`RecipeThumb` hero の枠に合わせる。
- 切替UIのボタンは既存トーン（`cooking-pane-photo-toggle` のような pill/小ボタン、`aria-label`・`aria-pressed` または選択状態の `data-` 属性）に合わせる。ツールチップ文言は TKT-0221 の方針と整合させる。
- 「写真を隠す」トグルの aria-label/文言は、動画表示中に「写真を…」のままだと不正確になるため「写真・動画を隠す」等へ調整してよい（既存テストが文言依存なら更新する）。
- テストでは iframe の実ロードは不要。`container.querySelector('iframe[src*="youtube-nocookie.com/embed/"]')` 等で src と属性を検証する。

## 非ゴール

- レシピ一覧・詳細パネル・編集画面への動画表示。
- YouTube 以外の動画サービス対応、再生位置記憶、自動再生。
- `recipes.source` の保存形式・DB schema の変更。
- 調理完成写真（cooking_history）まわりの変更。

## 依存チケット

- TKT-0234（YouTube埋め込み基盤）— **必須先行**。CSP frame-src と videoId 抽出ヘルパーが無いと成立しない。

## 残リスク

- ユーザーのネットワーク環境で YouTube がブロックされている場合は iframe が空になる（アプリ側ではフォールバック表示まではしない。写真切替で回避可能）。
