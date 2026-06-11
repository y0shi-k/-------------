---
id: TKT-0234-youtube-embed-foundation
title: YouTube埋め込み基盤（videoId抽出ユーティリティ＋CSP frame-src許可）
status: completed
goal: YouTube URLから videoId を安全に抽出できないこと・CSPがiframe埋め込みを全ブロックすることが、調理ビューアでの動画再生（TKT-0235）の前提を崩すのを防ぐ。
acceptance:
  - "`web/src/lib/youtube.ts` に `extractYoutubeVideoId(text: string): string | null` 相当の純関数が新設され、`watch?v=<id>`（クエリ順不同）/ `youtu.be/<id>` / `shorts/<id>` / `embed/<id>` 形式から videoId を抽出できる"
  - ホストは youtube.com / www.youtube.com / m.youtube.com / youtu.be / music.youtube.com のみ許容し、videoId は `[A-Za-z0-9_-]{11}` のみ有効。それ以外（非YouTubeドメイン・偽装ドメイン例 `evil-youtube.com`・11桁でないID・非URL文字列・空文字）は null を返す
  - 改行区切りの複数行テキスト（`recipes.source` 形式）から「最初に videoId が取れた行」を返すヘルパー（例 `findFirstYoutubeVideoId`）が同ファイルにある
  - `web/next.config.ts` の cspDirectives に `frame-src https://www.youtube-nocookie.com` が追加され、**他のディレクティブ・securityHeaders は一切変更されない**
  - 上記の正常系・異常系を網羅するユニットテスト（`web/src/__tests__/youtube.test.ts`）が追加され通る
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/lib/youtube.ts
  - web/src/__tests__/youtube.test.ts
  - web/next.config.ts
  - project-os/artifacts/TKT-0234/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0226-cooking-viewer-youtube
related_artifacts:
  - artifacts/TKT-0234/verify.json
  - artifacts/TKT-0234/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0234`。コマンドの正本は `harness/registry.json`
  - 非危険変更（純関数ユーティリティ＋CSPヘッダ1行）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - CSP はセキュリティヘッダのため、レビュー観点は「frame-src の許可ドメインが `https://www.youtube-nocookie.com` のみか」「他ディレクティブの diff が無いか」
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

調理ビューアで YouTube をインライン再生する（TKT-0235）ための土台。①YouTube URL から videoId を安全に抽出する純関数ユーティリティ、②CSP への `frame-src https://www.youtube-nocookie.com` 追加、の2点のみ。UI には触らない。

## 参照すべき既存実装

- `web/next.config.ts` … `cspDirectives` 配列（3-25行）。`default-src 'self'` で `frame-src` 未定義のため、現状 iframe は全ブロックされる。ここに `"frame-src https://www.youtube-nocookie.com"` を1要素追加する。
- `web/src/lib/ingredients/name-match.ts` … 純関数 lib＋ユニットテストの直近パターン（TKT-0222）。ファイル構成・export スタイルの参考。
- `web/src/__tests__/` … vitest のテスト配置。`youtube.test.ts` を新設する。
- `web/src/components/recipe-meal-workspace.tsx` の `RecipeSourceLinks`（4833行付近）… `recipes.source` が改行区切りテキストで、`/^https?:\/\//` 判定で行ごとにリンク化している現仕様。複数行ヘルパーの入力形式はこれに合わせる。

## 実装メモ

- 抽出は `new URL()` でのパースを基本にし、正規表現だけで済まさない（`evil-youtube.com/watch?v=...` のようなホスト偽装を弾くため）。ホスト名は完全一致リストで判定する。
- videoId バリデーション `[A-Za-z0-9_-]{11}` は埋め込みURL組み立て時のインジェクション防止を兼ねる。抽出結果をそのまま `youtube-nocookie.com/embed/<id>` に連結しても安全な値だけを返すこと。
- `shorts/<id>` / `embed/<id>` はパス区切りで取り、後続のクエリ（`?si=...` 等）や末尾スラッシュを無視する。`watch?v=` は `searchParams.get("v")` で取る。
- 関数はイミュータブル・副作用なし。React 依存を持たせない（lib 単体でテスト可能に）。
- CSP 変更は `frame-src` の追加のみ。`frame-ancestors 'none'`（自アプリが iframe に入れられるのを防ぐ側）とは別物なので混同して書き換えないこと。

## 非ゴール

- 調理ビューア UI への組み込み（TKT-0235 で行う）。
- YouTube 以外の動画サービス対応、YouTube Data API 連携。
- `recipes.source` の保存形式変更（DB schema 不変）。

## 依存チケット

- なし（本イニシアチブの土台。TKT-0235 が本チケットに依存する）

## 残リスク

- 将来 YouTube が新しい URL 形式を追加した場合は抽出関数の追従が必要（その場合も null フォールバックで安全側に倒れる）。
