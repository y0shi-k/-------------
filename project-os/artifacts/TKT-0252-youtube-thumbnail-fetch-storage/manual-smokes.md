---
ticket_id: TKT-0252-youtube-thumbnail-fetch-storage
required_evals:
  - web_project_bootstrap
  - photo_upload_storage
---

# Manual Smokes

## 実施内容

- [x] `web/src/lib/youtube.ts` の候補URL生成が、固定ホスト `img.youtube.com` と固定パス `/vi/<videoId>/<name>.jpg` だけを返すことをテストで確認。
- [x] 無効な videoId では fetch を呼ばないことを単体テストで確認。
- [x] `image/jpeg` / `image/png` / `image/webp` 以外の `content-type` を失敗扱いにすることを単体テストで確認。
- [x] `content-length` と取得後 `Blob.size` の上限チェックがあることを単体テストで確認。
- [x] Storage upload 成功 + recipes 更新成功で `<user_id>/recipe-images/<recipe_id>/...` の Storage path を返すことを単体テストで確認。
- [x] Storage upload 失敗時にDB更新しないことを単体テストで確認。
- [x] DB更新失敗時にアップロード済みStorage objectを削除することを単体テストで確認。

## コマンド確認

- `npm test -- --run src/__tests__/youtube.test.ts src/__tests__/recipe-image-upload.test.ts`: pass
- `npm run typecheck`: pass
- `harness/bin/verify_web.sh TKT-0252-youtube-thumbnail-fetch-storage`: pass

## 未実施

- 実Supabase Storageへのアップロードは未実施。今回はUI接続前の共通処理土台であり、Storage/DBは単体テストのモックで確認した。
- 開発環境での実YouTube取得は未実施。ネットワーク依存のためverify外とし、後続TKT-0253/TKT-0254のUI接続時に実機確認する。
