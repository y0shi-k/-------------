# AGENTS.md — Stock Master（料理レシピ・食材管理アプリ）

> このファイルは、このリポジトリで作業する AI 向けの唯一の入口です。詳細は `.agents/` と `project-os/` を参照してください。

---

## 最優先ルール（要約）

- 既存機能を壊さない。正本と生成物の境界を守る。
- 実装前は `project-os/tickets/TKT-*` を確認し、`spec_ready` + `implementation_ready` が揃うまで実装に入らない。
- スプレッドシートへの書き込み・更新・削除は、初期化を除き必ず `state.pendingSync` + `syncPendingChanges()` の手動一括同期に載せる。操作ごとの即時GAS通信は禁止。
- 変更後は verify を実行する。完了報告は `project-os/artifacts/TKT-xxxx/` に残す。

## プロジェクト概要

- **名称**: Stock Master — 料理レシピ・食材管理アプリ
- **形式**: 単一HTMLファイルをGeminiCanvasアプリとしてプレビュー
- **バックエンド**: Google Apps Script（GAS）。`GAS_URL` に設定された既存デプロイ済みエンドポイントへ通信する
- **開発・テストフロー**: コード変更後、AI は verify と静的確認を行い、`app.html` の内容をGemini Canvasに貼り付けたブラウザ実表示テストはユーザーが実施する。GAS側のスクリプトデプロイ作業は不要
- **現状**: Phase 1（DB構築＋モードA）実装中

## 正本ファイル

- `app.html` / `要件定義書.md` / `AGENTS.md` / `.agents/` / `harness/*.json`

## verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

**Canvas環境追加チェック（手動）**:
- `alert(` / `confirm(` / `prompt(` が残存していないか
- `showToast` 関数が存在するか
- `GEMINI_API_KEY` の空チェックバリデーションがないか
- スプシ書き込み系の新規コードが `syncPendingChanges()` 以外で個別 `executeGAS(payload...)` していないか
- 新規追加コードが既存パターンを再利用して肥大化していないか

## 詳細はこちら

- AI運用ルール: `.agents/index.md`
- 状態基盤: `project-os/index.md`
- 人向け文書: `docs/index.md`
