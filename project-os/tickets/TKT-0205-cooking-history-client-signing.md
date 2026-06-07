---
id: TKT-0205-cooking-history-client-signing
title: 料理履歴の完成写真をサーバ署名からクライアント側キャッシュ取得へ移行
status: draft
goal: page.tsx のサーバ署名依存をやめ、料理履歴写真をクライアント共有キャッシュで解決することで、router.refresh() 後の再ダウンロードも解消する。
acceptance:
  - `web/src/app/page.tsx` が料理履歴写真の `signed_url` をサーバ側で発行せず、`storage_path`（と必要メタ）をクライアントへ渡す
  - 料理履歴写真を表示する各箇所（`cooking-history-board.tsx` / `home-dashboard.tsx` / `cooking-record-edit-modal.tsx` / `recipe-meal-workspace.tsx` の完成写真プレビュー）が TKT-0203 の `useCachedSignedUrls` で path→URL を解決して表示する
  - `web/src/lib/cooking-history/types.ts` の写真型が `signed_url` 前提から `storage_path` 起点に整理され、型エラーが出ない
  - 「写真あり」判定・カレンダー/タイムライン/インサイトの写真表示・複数写真表示が従来どおり崩れない（手動確認し report に記録）
  - 在庫更新等で `router.refresh()` が走った後も、料理履歴の完成写真が再ダウンロードされない（DevTools Network で cache から出る）ことを手動確認し report に記録する
  - 未ログイン・本人以外のデータが表示されない（RLS は変更しないが、表示経路変更で回帰がないこと）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/app/page.tsx
  - web/src/components/cooking-history-board.tsx
  - web/src/components/home-dashboard.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/cooking-history/types.ts
  - project-os/artifacts/TKT-0205-cooking-history-client-signing/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0203-signed-url-cache
related_artifacts:
  - artifacts/TKT-0205-cooking-history-client-signing/verify.json
  - artifacts/TKT-0205-cooking-history-client-signing/report.md
owner_role: implementer
owner_notes:
  - 【非危険・ただし影響範囲が広い】読み取り側の署名URL解決経路の変更のみ。DBスキーマ/RLS/auth/アップロード経路・バケット公開設定は変更しない。
  - `photo_upload_storage` eval が画像/Storage語彙で過剰マッチしうるが実Storageセキュリティ無変更。`/check-gates` で match した場合も report に「読み取り経路変更のみ・公開設定/RLS無変更・storage_pathは非公開バケットで署名なしでは取得不可」と記録する運用。
  - 影響が広いため、手動確認（写真あり判定・カレンダー・タイムライン・インサイト・編集モーダル・レシピ完成写真プレビュー）を report に必ず残す。崩れが疑わしければ実装者は manual-smokes.md を任意で追加してよい。
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵を直書きしない。service role key をブラウザで使わない。
  - 先行依存 TKT-0203 の `useCachedSignedUrls(client, paths)` を使う。クライアントは `createBrowserSupabaseClient()`（`useMemo` 済み参照、`web-mode-shell.tsx:172` 参照）。
  - 既存のサーバ署名箇所: `web/src/app/page.tsx:118-122`（`historyPhotos` を `createSignedUrl(..., 60*30)` して `signed_url` を付与）。ここを storage_path 受け渡しに変更。
  - 写真型の正本: `web/src/lib/cooking-history/types.ts:14` `signed_url?: string | null`。`storage_path` を必須に、`signed_url` はクライアント解決へ移すか段階的に optional 維持。型変更が波及する全参照を typecheck で潰す。
  - 表示箇所の主な参照: `cooking-history-board.tsx`（`photo.signed_url` を多数参照: ~L124/165/183/280-339/431/482-548）。`home-dashboard.tsx`（ホームの完成写真）。`cooking-record-edit-modal.tsx:610`（既存写真表示）。`recipe-meal-workspace.tsx:2375-2378`（プレビュー）。
  - storage_path 配列を集めて `useCachedSignedUrls` で Map 化し、各表示で `map.get(path)` を参照する形に揃える。`signed_url` 直参照を段階的に置換。
  - サーバ署名を消すことで初回SSRに署名URLが含まれなくなる（初回はクライアントで解決）。初回の一瞬のプレースホルダは許容（フォールバックが効く）。回帰として「写真あり件数バッジ」がpath有無で判定できるようにする（署名URLでなく storage_path 有無で判定）。
  - verify は `/verify TKT-0205-cooking-history-client-signing`。
---

# Summary

料理履歴の完成写真を、`page.tsx` のサーバ署名（30分TTLの新トークン）依存から、クライアントの共有キャッシュ
（TKT-0203 `useCachedSignedUrls`）解決へ移す。`router.refresh()` のたびに新署名URL→再DLになっていた挙動を解消し、
「写真あり」判定は storage_path 有無で行う。表示崩れがないことを手動確認する。

## 実装メモ

- `page.tsx`: `historyPhotos` の `signed_url` 付与（`createSignedUrl`）を削除し、`storage_path` 等メタを渡す。
- 表示側: 各コンポーネントで料理履歴写真の `storage_path` を集約 → `useCachedSignedUrls(supabase, paths)` → `map.get(path)` を `<img src>` に。
- 型: `cooking-history/types.ts` の写真型を `storage_path` 起点へ。`signed_url` 参照を全置換し typecheck を通す。
- 「写真あり」判定（バッジ・件数・カレンダーの代表写真選択）は `storage_path` 有無ベースに変更。
- 回帰確認: カレンダー代表写真、タイムラインのサムネ、インサイト件数、編集モーダルの既存写真、レシピ完成写真プレビュー。

## 非対象

- recipe/ingredient/cooking候補 の差し替え（= TKT-0204）
- アップロード cacheControl 付与（= TKT-0206）
- DBスキーマ・RLS・auth・Storage バケット設定の変更

## 依存チケット

- TKT-0203-signed-url-cache-foundation（共有キャッシュ／`useCachedSignedUrls`）
- （TKT-0204 とは独立。並行実装可だが、同じフックに依存するため TKT-0203 完了後着手）
