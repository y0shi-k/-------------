---
ticket_id: TKT-0206-upload-cache-control
status: passed
review_scope:
  - SPEC-0203-signed-url-cache
  - TKT-0206-upload-cache-control
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- `web/src/components/inventory-board.tsx` … 料理写真 / 食材在庫画像 / ユーザー食材画像の3つの `upload()` options に
  `cacheControl: "31536000"` を追加。`contentType` / `upsert: false` は維持。
- `web/src/components/cooking-record-edit-modal.tsx` … 料理写真 `upload()` に同上を追加。
- `web/src/components/recipe-meal-workspace.tsx` … 料理写真 `upload()` に同上を追加。
- `web/src/lib/photos/recipe-image-upload.ts` … レシピ画像コピー時 / アップロード時の2つの `upload()` に同上を追加。
  最小クライアント型 `StorageBucketApi.upload` の options に `cacheControl?: string` を追加（Supabase 実型と整合）。
- `web/src/__tests__/recipe-image-upload.test.ts` / `web/src/__tests__/inventory-board.test.tsx` … upload options の
  期待値を `cacheControl: "31536000"` 込みへ更新。モック upload 型にも `cacheControl?: string` を追加。

## checked_artifacts

- `verify.json`: status=pass（lint/typecheck/test/build＋policy 全pass）。
- `report.md`: status=ready。
- `manual-smokes.md`: status=passed（execution_mode: static_only、実機チェックは skipped で明示）。

## subagent_usage

- 単純な定型追加（options へのキー1つ追加×7箇所＋型・テスト追従）のため、サブエージェントへ委譲せず
  オーケストレーターが直接実装・verify・finalize を実行。

## findings

- 全7経路で `upsert: false`（content-addressed、再アップロードは別 path）が維持されており、同一 path の内容は不変。
  長期 `cacheControl` の付与は安全。
- 公開URL生成・公開バケット化はなし。`photos` は非公開バケットのままで、署名URL経由のみアクセス可能。
  storage path / 公開URL の漏れなし。
- 元画像を不要に保存する変更はなし（圧縮前提 `compressed.blob` を維持）。
- テスト3件の当初失敗は upload options に `cacheControl` が増えたことによる期待値差分のみ。実装側ではなく
  アサーションを仕様に合わせて更新（テストの無効化・スキップはしていない）。
- **実Supabaseプローブで効果を実測**: メタデータには `cacheControl: max-age=31536000` が保存されるが、
  **署名URLのブラウザ向け `cache-control` には伝播しない**（GETはヘッダ無し / HEADは `no-cache`、`expires` は署名URL TTL連動）。
  → 変更は無害だが、チケットの当初目的（ブラウザHTTPキャッシュ寿命延長）はこの構成では達成されない。
  ユーザー判断で「変更は残し事実を記録して完了」とした（revert はしない）。

## open_risks

- 当初目的が未達である点を report / manual-smokes / learnings に明記。実体感改善は別レバー（署名URL TTL 延長）が必要で
  別チケット扱い。
- 撮影UIの実機目視（撮影・プレビュー・撮り直し・保存後表示）は未実施（ブラウザ実機要）。回帰なし想定。
- 危険eval `supabase_schema_change` は語彙過剰マッチ。schema/RLS/auth/バケット設定は無変更。

## verdict

合格（コード変更は安全・無害で正しく機能。ただし当初の体感改善目的は未達と実測。事実を成果物に記録のうえ
ユーザー判断で完了）。撮影UIの実機目視のみフォロー条件として残す。
