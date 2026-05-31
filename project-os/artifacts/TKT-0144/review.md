---
ticket_id: TKT-0144-inventory-storage-location-tag-picker
status: passed
review_scope:
  - TKT-0144-inventory-storage-location-tag-picker
---

# Review Record

## checked_diff_paths

- web/src/components/inventory-board.tsx
- web/src/__tests__/inventory-board.test.tsx

## checked_artifacts

- project-os/artifacts/TKT-0144/verify.json
- project-os/artifacts/TKT-0144/manual-smokes.md

## subagent_usage

- none

## findings

- フォームの保存場所欄（datalist付きテキスト入力）を `LocationTagPicker`（単一選択）に置換。レシピの `GenreTagPicker` と同じ globals.css の `genre-*` クラスを流用し、検索/既存選択/新規作成/外側クリックで閉じる挙動を再現。単一選択なのでチップは常に1つ、選択で置換。
- 新規作成は `addStorageLocation` で `storage_locations` へ `{ user_id: userId, name, sort_order }` を insert。追加前の重複チェック＋テーブルの `unique(user_id,name)` で二重登録を防止。成功時のみ `setStorageLocations` に追加＋`router.refresh()`。
- データ保護面（重点）:
  - insert は本人ID付きで、insert RLS（auth.uid() = user_id）に適合。本人以外へ影響しない。
  - Supabase schema / migration / RLS policy / auth / 写真Storage への変更は diff に無い（inventory-board.tsx とそのテストのみ）。
  - `storage_locations` / `inventory_items` / `storage.from("photos")` という語は既存コード由来で、スキーマ追加・Storage変更ではない。
- 既存挙動の温存: `storage_location` は単一文字列のまま。`storageLocationOptions`（マスタ＋食材から導出）・`location-tab-row`・フィルタ・集計は不変。既存の在庫追加（既定値「冷蔵庫」依存）テストは無改修で継続成功。
- テスト: 新規作成→insert→チップ表示を検証（`.genre-tag-name` でチップを特定）。54/54 成功。lint/typecheck/build もpass。
- コーディング規約: state はイミュータブル更新、未使用varなし、`locationPaletteIndex` の小helperをローカル定義（パレットはジャンルと同等）。

## open_risks

- 保存場所の削除・並べ替えは未実装（対象外。今回は追加と割り当てのみ）。
- ジャンル(複数選択)と保存場所(単一選択)でピッカーが別実装。共有コンポーネント化は将来のリファクタ候補。

## verdict

実装はチケットの受け入れ条件を満たす。レシピのジャンルと同じ操作感で保存場所を付与・新規作成でき、新規はマスタへ永続化されてタブに反映される。データベース構造・権限・認証・Storageへの変更は無く、データ保護面のリスクは無い。verify全pass・テスト全passを確認。承認。
