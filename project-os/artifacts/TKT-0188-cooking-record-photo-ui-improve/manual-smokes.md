---
ticket_id: TKT-0188-cooking-record-photo-ui-improve
status: passed
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
---

# Manual Smokes

## target_evals

- 編集モーダルの既存写真×削除（即非表示・確定で実削除・キャンセルで残る・元に戻すで復元）
- 新規追加写真のサムネ表示と×取り消し
- 既存のクリック選択・D&D・Ctrl+V・複数追加の維持
- スマホ幅でサムネグリッドが崩れないこと
- Storage/schema/auth/RLSを変更していないことの確認

## executed_checks

- `cooking-record-edit-modal.test.tsx` を拡張し（計8件）、(1) 既存写真×で即非表示＋「削除予定 N件」表示、(2)「元に戻す」で復元、(3) 新規写真がサムネ画像で表示、(4) 既存の複数ドロップ/非画像拒否/Ctrl+V/アクティブ化/ハイライト維持、を検証して成功しました。
- `npm run lint`、`npm run typecheck`、`npm run test`、`npm run build` を含むWeb版verifyが成功しました。
- 差分確認で、写真の実削除（`savePhotoChanges` の `storage.remove`＋`photos` delete）と実追加（`addNewPhotos`/`handleNewPhotosChange`）の処理本体は未変更であり、×は `deletedPhotoIds` への UI トグルに限定されていることを確認しました。
- Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認しました。
- Canvas版 `app.html` を編集していないことを確認しました。

## skipped_checks

- 実ブラウザでの「既存写真×→確定で実削除／キャンセルで残る」の最終目視は未実施です。実削除経路は未変更（既存 savePhotoChanges）のため、自動テストではUIトグルと表示の確認で代替しました。
- 実機での `revokeObjectURL` のリーク確認は未実施です。自動テストでは objectURL をスタブしているため、解放呼び出しの存在は静的確認＋クリーンアップ実装で担保しました。
- スマホ実機確認は未実施です。サムネグリッドは `repeat(auto-fill, minmax(92px,1fr))` で横はみ出ししない設計です。

## open_risks

- PCブラウザ上での実削除/復元の挙動、新規サムネ表示、スマホ幅のグリッドは、ユーザー環境で最終確認してください。
- `photo_upload_storage` / `supabase_schema_change` は語彙マッチにより発火していますが、実Storage設定・schema・削除/アップロード処理は変更していません。
