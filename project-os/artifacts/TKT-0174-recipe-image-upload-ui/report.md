---
ticket_id: TKT-0174-recipe-image-upload-ui
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

レシピ編集/作成UIから、ユーザー自身がレシピ画像を「登録・差し替え・削除」できるようにした。
あわせて、レシピ一覧カード・詳細・作りたい候補/提案・ホームの featured カードで、
表示優先順位を「ユーザー登録画像（署名付きURL）→ 固定デモ画像（resolveRecipeImage）→ 1文字プレースホルダ」
に統一した。TKT-0172 の固定デモ画像と既存プレースホルダのフォールバックは壊していない。

DB列・Storage基盤は前提の TKT-0173 で用意済み（`recipes.image_storage_path`、非公開 `photos` バケット、
先頭フォルダ = user_id の本人限定 storage policy / DB制約）。本チケットはその上に乗る UI とアップロード/削除フローのみ。

## 今回追加した安全装置

- **公開URLを保存しない**: DB には Storage path のみを保存し、表示は短命の署名付きURL（既存TTL 30分）で行う。
  発行は `web/src/lib/photos/use-recipe-image-urls.ts`（`useRecipeImageUrls`）と `createUserImageSignedUrl` 経由。
- **本人領域限定の path 規約**: アップロード path を `<user_id>/recipe-images/<recipe_id>/<uuid>.webp` に固定。
  TKT-0173 の storage policy（先頭フォルダ = auth.uid()）と DB制約 `recipes_image_path_owned` の二重防御内に収まる。
  DB更新は `.eq("user_id", userId)` を必ず付ける。
- **元画像を巨大なまま保存しない**: `compressRecipeImageFile`（`web/src/lib/photos/compress.ts`）で
  4:3中央クロップ・最長辺1280px・WebP(q0.82) に圧縮。WebP非対応環境は JPEG へフォールバック。
- **二重送信防止・ローディング**: 保存中は `isSaving` でボタン無効化＋「保存中...」表示。
- **孤児オブジェクトの後始末**: 差し替えは「新規upload→DB更新」成功後に旧 object を削除。
  DB更新が失敗した場合は今 upload した object を即時削除して孤児を残さない。
  削除（レシピ画像）は DB を `null` に更新してから Storage object を削除（表示は確実にフォールバックへ）。
  レシピ本体削除時も DB削除成功後に画像 object を削除。
- **エラー表示の質**: 失敗時は「原因 / 影響 / 修正方法」が分かる文面に統一
  （非対応ファイル・圧縮失敗・upload失敗・DB更新失敗など）。

## 実施した確認

- `/verify TKT-0174-recipe-image-upload-ui` … **VERIFY_PASSED**
  - lint pass / typecheck pass / test 180件 pass / build pass
  - policy: no_gas_dependency pass / no_hardcoded_secret pass / supabase_rls_present pass
  - 結果は `verify.json` に記録。
- 追加テスト（vitest）の観点:
  - `recipe-image-upload.test.ts`: path規約・contentType・`upsert:false`・DB更新、差し替え時の旧object削除、
    削除失敗時の `staleRemovalFailed`、upload失敗時にDB更新しない、DB更新失敗時の孤児クリーンアップ、削除のDB→Storage順序。
  - `use-recipe-image-urls.test.ts`: null path は発行せずMap非掲載、署名失敗pathも非掲載、対象0件で createSignedUrl 未呼出。
  - `compress-recipe-image.test.ts`: WebP/JPEG 拡張子マッピング。
  - `recipe-thumb.test.tsx`: 署名URL優先 → URL失敗でデモ → デモも失敗でプレースホルダ。
- 静的レビューは `review.md`、手動スモーク方針は `manual-smokes.md` を参照。

## 残リスク

- **migration 適用が前提**: TKT-0173 の `20260605120000_user_image_columns.sql` が対象DBに未適用だと
  `image_storage_path` 列が無く保存が失敗する。本番/hosted への `supabase db push` は人が明示実行する運用。
- **画像圧縮の実機未検証**: Canvas `toBlob`/`drawImage` は jsdom で動かないためユニット未カバー。
  純粋ロジック（拡張子・path・upload/delete分岐）はテスト済みだが、実ブラウザでのWebP出力可否・圧縮品質は手動確認が必要。
- **Storage削除のみ失敗した場合**: 表示は正しく切り替わるが不要ファイルが残る可能性。`staleRemovalFailed` で通知。
  先頭フォルダ = user_id のため本人限定のままで、データ漏洩リスクはなし。
- **極端な縦横比の画像**: 中央クロップで主題が外れる可能性（SPEC既知リスク）。
- **編集モーダル初回**: 署名URLが非同期で揃う前は、既存画像プレビューが一瞬「画像なし」表示になりうる（揃い次第更新）。
- **クロスユーザー拒否の最終担保**: コード側は user_id 一致と path 先頭=user_id を守るが、最終権限は Supabase policy 依存。
  手動スモークでクロスユーザー read/write 拒否の確認を推奨。

## 次の依頼や人判断

- 実機（スマホ含む）での手動スモーク実行（圧縮品質・WebP出力・スマホ幅のボタン重なり・クロスユーザー拒否）。
- 食材画像登録UIは TKT-0176 で別途実装（本チケット非対象）。
- 無関係の未コミット変更について: 作業ツリーに本チケットと無関係の `docs/index.md` 変更と
  `docs/runbook/Supabaseの反映と運用ガイド.md` 新規が存在する。実装者（本チケット）は作成しておらず、
  内容も Supabase 運用ガイドで TKT-0174 と無関係のため触っていない。コミット範囲をどうするかは人判断。
