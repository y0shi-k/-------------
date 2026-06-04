---
ticket_id: TKT-0174-recipe-image-upload-ui
status: passed
execution_mode: static_only
target_evals:
  - photo_upload_storage
  - supabase_schema_change
  - auth_and_rls_policy
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- photo_upload_storage … 画像圧縮・Supabase Storage 保存/差し替え/削除の変更。
- supabase_schema_change … 前提の `image_storage_path` 列（TKT-0173）を利用する変更。
- auth_and_rls_policy … 本人領域限定の path・user_id 一致・署名付きURL の権限まわり。
- pwa_mobile_ui … スマホ幅での画像UI（プレビュー枠・操作ボタン）の崩れ確認。

## executed_checks

自動検証（コードレベルで担保済み・vitest / verify）:

- [x] `/verify TKT-0174-recipe-image-upload-ui` が VERIFY_PASSED（lint/typecheck/test 180/build + policy 3項目）。
- [x] アップロード path が `<user_id>/recipe-images/<recipe_id>/<uuid>.webp` 規約・`upsert:false`・正しい contentType。
- [x] 差し替え時に旧 Storage object の削除が呼ばれる。削除失敗時に `staleRemovalFailed` が立つ。
- [x] upload 失敗時は DB を更新しない。DB更新失敗時は今 upload した孤児 object を削除する。
- [x] 削除は DB(`null`)→Storage の順。DB失敗時は Storage を触らない。
- [x] 表示優先順位（署名URL → デモ → プレースホルダ）の段階フォールバックが RecipeThumb で機能する。
- [x] 署名URL: null path は発行しない／署名失敗 path は Map 非掲載／対象0件で createSignedUrl 未呼出。

## skipped_checks

実ブラウザ/実機が必要で、本環境（jsdom・CI相当）では実行できないもの:

- [ ] 実ブラウザでの画像圧縮（Canvas `toBlob`/`drawImage`）の WebP 出力可否・圧縮品質・4:3クロップ結果。
- [ ] スマホ実機ビューポートでの画像UI（選択/プレビュー/差し替え/削除ボタン）の重なり・タップ操作。
- [ ] 実 Supabase に対するアップロード→署名URL表示→差し替え→削除のエンドツーエンド動作。
- [ ] 未ログイン状態でアップロードできないこと、他ユーザーのレシピ画像を read/write できないこと（RLS / storage policy の実動作）。
- [ ] migration `20260605120000_user_image_columns.sql` 適用済み環境での保存成功。

## open_risks

- 圧縮の実機未検証（jsdom 制約）。純粋ロジックはテスト済みだが品質・出力可否は手動確認待ち。
- Storage削除のみ失敗時に不要ファイルが残る可能性（表示影響なし・本人限定のまま・`staleRemovalFailed` で通知）。
- 極端な縦横比の画像は中央クロップで主題が外れうる（SPEC既知）。
- クロスユーザー拒否の最終担保は Supabase policy 依存。実機スモークでの確認を推奨。
