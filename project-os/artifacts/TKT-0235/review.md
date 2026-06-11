---
ticket_id: TKT-0235-cooking-viewer-youtube-player
status: passed
review_scope:
  - SPEC-0226-cooking-viewer-youtube
  - SPEC-0124-cooking-viewer-web
  - TKT-0235-cooking-viewer-youtube-player
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/recipe-meal-workspace.tsx（state `cookingMediaTab`・切替タブ・iframe・トグル文言出し分け）
- web/src/app/globals.css（cooking-pane-media-tabs / cooking-pane-photo-video）
- web/src/__tests__/recipe-meal-workspace.test.tsx（テスト2件追加）

## checked_artifacts

- project-os/artifacts/TKT-0235/verify.json（status: pass）
- project-os/artifacts/TKT-0235/manual-smokes.md（status: passed）

## subagent_usage

- impl-deep（Opus）に実装を委譲（route_model は fast 判定だったが、約4,800行コンポーネント内の state 設計を含むため承認済みプランどおり deep を使用）。オーケストレーター（Fable 5）がコードレビューと verify を実施。

## findings

- iframe src は `https://www.youtube-nocookie.com/embed/${youtubeVideoId}` の固定組み立てで、videoId は TKT-0234 の `[A-Za-z0-9_-]{11}` 検証済み値のみ。XSS/URL インジェクションの余地なし。判定ロジックの重複実装もない（`findFirstYoutubeVideoId` 再利用）。
- `useMemo` は early return（`if (!recipe)`）より前に配置されフックルール遵守。state 更新は setState のみでイミュータブル規約に適合。
- 別レシピを開き直したときのリセットは `openCookingViewer` 内で実施（既存 `isCookingPhotoOpen` リセットと同じ場所）。
- アクセシビリティ: 切替タブに `role="group"`・`aria-pressed`・`aria-label`・`data-tooltip`（TKT-0221 方針と整合）。トグルの aria-label は動画有無で出し分け。
- 危険 eval の自動マッチは「写真/photo」語と並行セッション（TKT-0228〜0233 auth）の未コミット変更の同居によるもの。本チケット3ファイルの diff に Storage / schema / auth 変更がないことを確認した。

## open_risks

- 実機での視覚確認（iframe 高さ・タブ配置・CSP violation なし）はユーザーの実機スモーク待ち。

## verdict

- passed。表示のみの変更で、埋め込み URL の組み立ては検証済み videoId に限定されており安全。
