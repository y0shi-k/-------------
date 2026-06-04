---
ticket_id: TKT-0174-recipe-image-upload-ui
status: passed
review_scope:
  - SPEC-0174-recipe-image-upload-ui
  - TKT-0174-recipe-image-upload-ui
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/photos/recipe-image-upload.ts（新規・中核ロジック）
- web/src/lib/photos/use-recipe-image-urls.ts（新規・署名付きURL発行フック）
- web/src/lib/photos/compress.ts（compressRecipeImageFile / imageExtensionFromContentType / buildRecipeImageStoragePath 追加）
- web/src/lib/photos/user-image.ts（SignedUrlCapableClient を export）
- web/src/components/ui/recipe-thumb.tsx（imageUrl prop と段階フォールバック）
- web/src/components/recipe-meal-workspace.tsx（画像ピッカーUI・保存/差し替え/削除フロー・配線）
- web/src/components/home-dashboard.tsx（featured カードのユーザー画像優先）
- web/src/app/globals.css（.recipe-image-field 系・スマホ幅の重なり対策）
- web/src/__tests__/（recipe-image-upload / use-recipe-image-urls / compress-recipe-image / recipe-thumb / home-dashboard）

## checked_artifacts

- verify.json（status=pass、checks 4項目 + policy 3項目すべて pass）
- report.md（本チケット）
- manual-smokes.md（本チケット）

## subagent_usage

- impl-deep（Opus）に実装を委譲（危険 eval: photo_upload_storage / auth_and_rls_policy を含むため route_model.py が deep を選択）。
- 本セッション（オーケストレーター）が verify / check-gates / 静的レビューを実施。

## findings

- **公開URL非保存・本人領域限定**: DB には Storage path のみ保存。upload path は
  `<user_id>/recipe-images/<recipe_id>/<uuid>.webp` で先頭フォルダ = user_id。
  DB更新は `.eq("id", recipeId).eq("user_id", userId)` を必ず付与。TKT-0173 の storage policy と
  DB制約 `recipes_image_path_owned` の二重防御内に収まる。新規 policy 追加なし（妥当）。→ 問題なし。
- **後始末順序が正しい**（recipe-image-upload.ts を確認）:
  - 差し替え: upload → DB更新 → 旧object削除。DB更新失敗時は今uploadした孤児を即 remove。
  - 削除: DB(null)更新 → Storage remove（DBを正とし表示は確実にフォールバック）。
  - 旧object削除失敗は処理成功扱い＋`staleRemovalFailed` で通知（表示に影響なし）。→ 設計妥当。
- **例外を投げない結果型**（`{ ok, error? }`）で UI フィードバックが安定。エラー文は「原因/影響/修正方法」形式に統一。→ 良。
- **段階フォールバック**（recipe-thumb.tsx）: 署名URL → デモ → プレースホルダ。
  imageUrl 変更時に失敗フラグを戻す useEffect あり。onError で段階降格。→ 正しく機能。
- **圧縮**: 4:3中央クロップ・最長辺1280px・WebP(q0.82)、非対応時 JPEG。元画像を巨大なまま保存しない要件を満たす。
- **イミュータブル / 入力検証**: mutation なし。accept="image/*"＋contentType チェックで非画像を弾く。
- **既存非破壊**: 既存テスト含む 180件 pass。固定デモ画像・プレースホルダのフォールバックは維持。

軽微・観点メモ（ブロッカーではない）:
- 画像圧縮は jsdom で実行不可のためユニット未カバー（純粋ロジックのみテスト）。実機確認は manual-smokes に委譲。
- 編集モーダル初回、署名URL が揃う前に一瞬「画像なし」表示になりうる（揃い次第更新）。UX上許容。

## open_risks

- migration（TKT-0173）未適用環境では保存失敗（運用前提として人が `supabase db push`）。
- Storage削除のみ失敗時に不要ファイルが残る可能性（表示影響なし・本人限定・通知あり）。
- クロスユーザー read/write 拒否の最終担保は Supabase policy 依存 → 実機スモーク推奨。
- 本チケットと無関係の未コミット変更（docs/index.md・docs/runbook/Supabaseの反映と運用ガイド.md）が
  作業ツリーに存在。実装者は作成・編集しておらず、コミット範囲は人判断。

## verdict

passed — SPEC-0174 / TKT-0174 の acceptance を満たし、危険変更（photo Storage / schema利用 / auth・RLS）の
安全装置（公開URL非保存・本人領域限定 path・署名付きURL・孤児後始末・構造化エラー）が実装されている。
verify は全項目 pass。実機での圧縮品質・スマホUI・クロスユーザー拒否は manual-smokes の skipped_checks として残る。
