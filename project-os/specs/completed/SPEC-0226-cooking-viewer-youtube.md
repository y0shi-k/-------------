---
id: SPEC-0226-cooking-viewer-youtube
title: 調理ビューア写真エリアでのYouTubeインライン再生（写真⇔動画切替）
status: draft
scope:
  - 調理ビューア（CookingViewer 全画面オーバーレイ）の写真エリア（cooking-pane-photo）
  - YouTube URL 判定・videoId 抽出ユーティリティ（web/src/lib/youtube.ts 新設）
  - CSP（web/next.config.ts）への frame-src 追加
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - レシピの `source` カラム（DB schema）は変更しない。改行区切りテキストの既存仕様のまま
  - Supabase Storage / Auth・RLS / AI route / CSV移行は触らない
  - CSP の frame-src は `https://www.youtube-nocookie.com` のみ許可（youtube.com 本体・その他ドメインは許可しない）
  - 埋め込みは privacy-enhanced モード（youtube-nocookie.com/embed/）を使い、autoplay はしない
acceptance:
  - レシピの source に YouTube URL（watch?v= / youtu.be/ / shorts/ / embed/ 形式）が含まれる場合、調理ビューアの写真エリアで動画をインライン再生できる
  - 写真と YouTube URL の両方があるレシピでは、写真エリアに「写真⇔動画」切替UIが表示され、動画が初期表示になる。切替で写真にも戻せる
  - YouTube URL が無いレシピでは切替UIが出ず、従来どおり写真（またはプレースホルダ）のみ表示される
  - 既存の「写真を隠す」開閉トグル（TKT-0219）と共存し、閉じた状態では動画も畳まれる
  - YouTube iframe が CSP にブロックされない（DevTools Console に CSP violation が出ない）
  - frame-src 追加以外の CSP ディレクティブは変更されない
related_tickets:
  - TKT-0234-youtube-embed-foundation
  - TKT-0235-cooking-viewer-youtube-player
---

# Summary

調理ビューアのヘッダーにはレシピ参考元 URL（`RecipeSourceLinks`）が外部リンクとして出ているが、YouTube レシピ動画は別タブでしか見られず、調理中の参照が不便。写真エリア（`cooking-pane-photo`）で YouTube をインライン再生できるようにする。

## 背景

- レシピの参考元は `recipes.source`（text・改行区切りで複数 URL/テキストを保持）。YouTube 固有の構造化カラムは無く、追加もしない。
- 写真エリアは TKT-0219 で開閉トグル付きで導入済み（`isCookingPhotoOpen` state、`RecipeThumb` 描画）。
- 現状コードベースに YouTube/embed/iframe の処理は一切存在しない。
- `web/next.config.ts` の CSP は `default-src 'self'` で `frame-src` 未定義のため、**このままでは iframe 埋め込みがブラウザにブロックされる**。frame-src の追加が前提条件。

## 仕様

- **videoId 抽出**（TKT-0234）: `web/src/lib/youtube.ts` に純関数を新設。対応形式は
  `https://www.youtube.com/watch?v=<id>`（クエリ順不同）/ `https://youtu.be/<id>` / `https://www.youtube.com/shorts/<id>` / `https://www.youtube.com/embed/<id>`、ホストは `youtube.com` / `www.youtube.com` / `m.youtube.com` / `youtu.be` / `music.youtube.com` を許容。videoId は `[A-Za-z0-9_-]{11}` のみ有効とし、それ以外・非YouTube URL・非URL文字列は null を返す（埋め込みURLへの任意文字列混入を防ぐ）。
- **CSP**（TKT-0234）: `web/next.config.ts` の cspDirectives に `frame-src https://www.youtube-nocookie.com` を1行追加。他ディレクティブは不変。
- **ビューアUI**（TKT-0235）: `recipe.source` を改行 split し、最初に videoId が取れた行を採用。
  - YouTube あり: 写真エリアに「写真/動画」切替（既存トーンのボタンUI）。初期表示は動画。動画は `https://www.youtube-nocookie.com/embed/<videoId>`（autoplay なし）の iframe（`title`・`allowFullScreen`・`allow="encrypted-media; picture-in-picture"` 付き）。
  - YouTube なし: 現状と同一（切替UI非表示）。
  - 「▲ 写真を隠す」トグルは領域全体（写真も動画も）を畳む。文言の写真/動画出し分けは実装裁量。

## 非対象

- レシピ編集画面・レシピ一覧・詳細パネルへの動画表示。
- YouTube 以外の動画サービス（ニコニコ・Instagram 等）。
- サムネイル取得・動画タイトル取得などの YouTube API 連携（iframe 埋め込みのみ）。
- `recipes.source` の構造化（カラム追加・JSON化）。

## Acceptance Example

- YouTube URL 入りレシピで調理ビューアを開く → 動画が初期表示され、切替で写真へ戻せる。Console に CSP violation なし。
- YouTube URL 無しレシピ → 従来どおり写真のみ・切替UIなし。
- `project-os/artifacts/TKT-0234/`・`project-os/artifacts/TKT-0235/` の verify.json / report.md で達成可否を判定できる。
