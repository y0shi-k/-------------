# TKT-0237 実装レポート

## 結論

案2「買い物かご + 食材」の生成画像を、Web版のホーム追加用アイコンとして実装した。

## 変更内容

- `web/public/icons/` にアイコン画像を追加
  - `stock-master-icon-1024.png`
  - `stock-master-icon-512.png`
  - `stock-master-icon-192.png`
  - `apple-touch-icon.png`
- `web/public/manifest.json` を追加し、PWA名・テーマカラー・192px/512pxアイコンを定義
- `web/src/app/layout.tsx` の metadata に `manifest` / `icon` / `apple` を追加
- `.gitignore` に `!web/public/icons/*.png` を追加し、アプリ用PNGだけGit管理できるようにした
- `SPEC-0237` と `TKT-0237` を作成

## なぜこの実装か

ホーム画面追加時のアイコンは、画像を置くだけでは端末に伝わらない。Android/Chrome系は `manifest.json`、iOS/Safari系は apple touch icon を見るため、両方を設定した。

## セキュリティ

- APIキー、Supabase秘密鍵、ユーザーデータ、Storage設定は変更していない。
- 追加したのは公開静的画像と公開manifestのみ。
- DB schema / Auth・RLS / Storage / AI route は未変更。

## verify

- `npm run lint`: 成功（既存 warning 2件）
- `npm run typecheck`: 成功
- `npm run test`: 成功（47ファイル、522テスト）
- `npm run build`: 成功（既存 warning 2件）
- `manifest.json` JSON構文確認: 成功

## 残リスク

- 端末側のホーム画面アイコンはキャッシュされやすい。既にホーム追加済みの場合は、削除してから追加し直す必要がある。
- 実機でのホーム追加表示確認は未実施。
