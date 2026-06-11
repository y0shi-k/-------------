---
ticket_id: TKT-0235-cooking-viewer-youtube-player
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

レシピ参考元が YouTube のとき、調理ビューアから別タブへ飛ばないと動画を見られなかった。写真エリア（`cooking-pane-photo`・TKT-0219 で導入）で YouTube をインライン再生できるようにした。ユーザー決定仕様: YouTube URL があるレシピは**動画を初期表示**し、「写真⇔動画」切替で写真にも戻せる。

- `web/src/components/recipe-meal-workspace.tsx`: 親 RecipeMealWorkspace に state `cookingMediaTab: "video" | "photo"` を追加し、`openCookingViewer` で `findFirstYoutubeVideoId(recipe.source)` の有無により初期値（あり=video）へリセット。CookingViewer 内で videoId を `useMemo` 算出（判定は TKT-0234 の `web/src/lib/youtube.ts` を再利用）。YouTube ありのときだけ `role="group"` の切替タブ（`aria-pressed`/`data-tooltip` 付き）を表示し、動画は `https://www.youtube-nocookie.com/embed/<videoId>` の iframe（autoplay なし・`title`・`allowFullScreen`・`allow="encrypted-media; picture-in-picture"`）。「写真を隠す」トグルは動画ありレシピでは「写真・動画を隠す/表示」へ文言を出し分け。
- `web/src/app/globals.css`: `.cooking-pane-photo-video`（aspect-ratio 16/9・幅100%）と pill 型 `.cooking-pane-media-tabs` を追加。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`: テスト2件追加（YouTube あり=iframe 初期表示・src/title/allowfullscreen 検証・切替で写真⇔動画、YouTube なし=切替UI非表示・写真のみ）。

## 今回追加した安全装置

- iframe の src は `[A-Za-z0-9_-]{11}` 検証済みの videoId のみで組み立て（任意文字列が URL に混入しない）。許可ドメインは CSP（TKT-0234）でも youtube-nocookie に限定。
- YouTube URL が無いレシピ・抽出失敗時は従来の写真表示へフォールバックし、切替UI自体を出さない（既存挙動が壊れない）。
- 別レシピを開き直すと切替状態が初期値へリセットされ、前のレシピの表示状態を引きずらない。

## 実施した確認

- `/verify TKT-0235`: lint / typecheck / test / build すべて pass。policy も pass。`verify.json` 参照。
- `recipe-meal-workspace.test.tsx` 単体: 63件 pass（新規2件含む）。

## 残リスク

- ネットワークで YouTube がブロックされる環境では iframe が空表示になる（フォールバック表示はせず、写真切替で回避する方針＝チケット既知）。
- 16:9 の iframe と従来 hero 写真枠の高さは厳密一致ではない。実機幅での見た目は下記スモークで確認する。

## 次の依頼や人判断

- **実機スモーク（ユーザー）**: YouTube URL 入りレシピで調理ビューアを開き、①動画が初期表示される ②写真⇔動画切替が効く ③「写真・動画を隠す」で畳める ④DevTools Console に CSP violation が出ない ⑤PC幅・スマホ375px幅で崩れない、を目視確認。
- `/check-gates` の危険 eval マッチは、並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更の同居と「写真/photo」語の過剰マッチによるもの。本チケットは表示のみで Storage / schema / auth / `recipes.source` 保存形式は不変（manual-smokes.md / review.md に詳細）。
