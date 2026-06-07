---
ticket_id: TKT-0205-cooking-history-client-signing
status: passed
review_scope:
  - SPEC-0203-signed-url-cache
  - TKT-0205-cooking-history-client-signing
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- `web/src/app/page.tsx` … 料理履歴写真への `createSignedUrl` 付与（`signedPhotos` 生成）を削除し、`storage_path`
  メタを含む生データをクライアントへ受け渡し。
- `web/src/lib/cooking-history/types.ts` … `storage_path` を表示起点と明記、`signed_url` を `@deprecated`（互換のため optional 維持）。
- `web/src/components/cooking-history-board.tsx` … `createBrowserSupabaseClient`（useMemo）＋ `useCachedSignedUrls` で
  `Map<storage_path,url>` を解決。「写真あり」判定・件数バッジ・カレンダー代表写真・タイムライン・インサイトを
  `storage_path` 有無＋Map解決ベースへ置換。未解決時はフォールバック表示。
- `web/src/components/cooking-record-edit-modal.tsx` … `ExistingPhotoList` に supabase prop＋`useCachedSignedUrls` を導入し
  既存写真表示を Map 解決へ。
- `web/src/__tests__/cooking-history-board.test.tsx` … `@/lib/supabase/browser` と `@/lib/photos/signed-url-cache` を
  モックし、storage_path→URL を同期解決。表示経路変更に追従して9件 pass。

## checked_artifacts

- `verify.json`: status=pass（lint/typecheck/test/build＋policy 全pass）。
- `report.md`: status=ready。
- `manual-smokes.md`: status=passed（execution_mode: static_only、実機チェックは skipped で明示）。

## subagent_usage

- impl-fast（Sonnet）で実装。オーケストレーター側でテスト失敗（env未設定でのbrowser client throw）を特定し、
  テストにモックを追加して修正。verify/check-gates/finalize はオーケストレーターが実行。

## findings

- 実装は参考実装 `inventory-board.tsx`（既存の `useCachedSignedUrls` 利用箇所）と一貫したパターン。
- 当初テスト9件失敗の原因は、コンポーネントが実 `createBrowserSupabaseClient()` を呼ぶようになり、テスト環境で
  `NEXT_PUBLIC_SUPABASE_URL` 未設定により throw したこと。テスト側モック追加で解消（実装側の問題ではない）。
- DBスキーマ/RLS/auth/Storageバケット設定/アップロード経路は無変更。読み取り側の署名URL解決経路のみの変更。

## open_risks

- 実機スモーク（カレンダー/タイムライン/インサイト/編集モーダル/レシピプレビュー表示、`router.refresh()` 後の
  `from cache` 確認、RLS回帰）が未実施。`manual-smokes.md` の skipped_checks を要フォロー。
- 危険eval2件（`supabase_schema_change` / `photo_upload_storage`）は語彙過剰マッチ。`storage_path` は非公開バケットで
  署名なしでは取得不可・公開設定/RLS無変更のため Storage セキュリティ面の新規リスクなしと判断。

## verdict

合格（静的確認＋自動verify範囲）。実機スモークのフォローを残条件とする。
