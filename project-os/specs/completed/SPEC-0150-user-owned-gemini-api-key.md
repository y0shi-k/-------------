---
id: SPEC-0150-user-owned-gemini-api-key
title: Gemini APIキーをユーザー持ちにする
status: spec_ready
scope:
  - web/src/app/api/ai/
  - web/src/components/
  - web/src/lib/ai/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Gemini APIキーをDBへ保存しない
  - Gemini APIキーをログへ出さない
  - Gemini APIキーをGit管理ファイルへ直書きしない
  - 既存のサーバー側 `GEMINI_API_KEY` は後方互換として残すか、実装時に段階移行を明示する
acceptance:
  - ユーザーが自分のGemini APIキーを入力してAIレシピ生成を実行できる
  - ユーザーが自分のGemini APIキーを入力して食材写真解析を実行できる
  - ユーザーAPIキーはDBに保存されず、ブラウザ保存のみ、またはセッション中のみの扱いになっている
  - サーバーAPI routeは受け取ったキーをGemini呼び出しにだけ使い、レスポンスやログへ返さない
  - APIキー未入力時は「ユーザー自身のGemini APIキーが必要」と分かるエラーを表示する
  - Web版verifyが通る
related_tickets:
  - TKT-0150-user-owned-gemini-api-key
---

# Summary

運営者側の `GEMINI_API_KEY` を前提にせず、ユーザーが自分で用意したGemini APIキーでAI機能を使えるようにする。

## 背景

現状のAI機能はサーバー環境変数 `GEMINI_API_KEY` を使う。公開サービスとして運用すると、運営者のAPI利用料が増えるリスクがある。初期方針として、ユーザー自身がGemini APIキーを用意し、そのキーでAI機能を実行する形にする。

## 仕様

- UIにGemini APIキー入力欄を追加する。
  - AIレシピ生成と食材写真解析の両方から使える位置に置く。
  - 入力値はマスク表示を基本にする。
  - 保存方式は実装時に選ぶが、MVPは `localStorage` または `sessionStorage` とする。
- サーバーAPI routeは、リクエストbodyまたはheaderで受け取ったユーザーAPIキーを使う。
  - `web/src/app/api/ai/recipes/route.ts`
  - `web/src/app/api/ai/scan-ingredients/route.ts`
- サーバーはユーザーAPIキーを保存しない。
  - Supabase DBに保存しない。
  - console/logに出さない。
  - エラーレスポンスに含めない。
- 既存のサーバー環境変数 `GEMINI_API_KEY` の扱いは実装時に明示する。
  - 推奨MVP: ユーザーキーがあればユーザーキーを使う。なければ環境変数を使わず、ユーザーに入力を促す。
  - 開発中の後方互換が必要なら、ローカル限定のfallbackとして扱い、docsに明記する。

## セキュリティ注意

- ユーザーAPIキーをブラウザに保存する方式は、端末を共有している場合やXSSがある場合に盗まれるリスクがある。
- 公開時は「このアプリは入力されたAPIキーを保存しない」「ブラウザ内に保存する場合がある」「不要になったら削除できる」ことをUIまたはdocsで説明する。
- より安全にするなら、毎回入力またはsessionStorageのみ保存を選べるようにする。

## 非対象

- Gemini利用量のアプリ側課金管理
- ユーザーAPIキーの暗号化DB保存
- Google Cloud側のAPIキー作成代行
- Supabase schema変更

## 手動確認

- APIキー未入力時に分かりやすいエラーが出る。
- APIキー入力後、AIレシピ生成が動く。
- APIキー入力後、食材写真解析が動く。
- ブラウザのNetworkレスポンスにAPIキーが返っていない。
- サーバーログにAPIキーが出ていない。
