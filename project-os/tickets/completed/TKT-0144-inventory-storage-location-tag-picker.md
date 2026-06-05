---
id: TKT-0144-inventory-storage-location-tag-picker
title: 食材の保存場所をジャンルと同じタグピッカーで付与・新規追加できるようにする
status: completed
goal: 食材追加/編集フォームの保存場所欄を、レシピのジャンルタグと同じAppSheet風ピッカー（単一選択＋新規作成）にし、新規保存場所はstorage_locationsマスタへ登録して上部タブに反映する
acceptance:
  - 食材フォームの保存場所欄がジャンルと同じタグピッカー（検索/既存選択/新規作成）になっている
  - 1食材＝1保存場所（単一選択）。storage_locationは単一文字列のまま
  - 新規保存場所はstorage_locationsテーブルへinsertされ、食材0件でも上部タブに残る
  - 既存の在庫追加・保存場所フィルタ・集計が従来どおり動く
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - ui_component_addition
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0144/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0116-storage-location-management-web
related_artifacts:
  - artifacts/TKT-0144/verify.json
  - artifacts/TKT-0144/manual-smokes.md
  - artifacts/TKT-0144/review.md
  - artifacts/TKT-0144/report.md
owner_role: implementer
owner_notes:
  - 実体はUI改修＋既存 storage_locations テーブルへの insert のみ。schema/migration/RLS/Storage/auth は不変
  - check-gates は diff 内の文字列(既存の storage.from("photos") / storage_locations / inventory_items)で photo_upload_storage / supabase_schema_change を保守的にマッチするが、写真Storageもスキーマも変更していない
  - レシピの GenreTagPicker と同じ globals.css の genre-* クラスを流用（共有コンポーネント化は将来のリファクタ）
---

# Summary

`inventory-board.tsx` のフォーム保存場所欄（datalist付きテキスト入力）を、レシピのジャンルタグと同じAppSheet風ピッカー（単一選択版 `LocationTagPicker`）に置換。新規保存場所は `addStorageLocation` で `storage_locations` テーブルへ insert し、`storageLocations` state を更新＋`router.refresh()`。上部フィルタタブ（`location-tab-row`）はマスタ＋食材から導出されるため、新規作成した保存場所が食材0件でもタブに残る。

## 実装メモ

- `storageLocations` を可変化（TKT-0140 で読み取り専用化していたものを add のみ復活）
- `LocationTagPicker`: 単一選択。選択中を1チップ表示、検索/×/＋、候補チェックリスト、未存在語は「新規作成」行
- storage_location は単一文字列のまま（複数タグ化・スキーマ変更なし）
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きしない。RLS/Storage権限は本変更で不変

## 残リスク

- 保存場所の削除・並べ替えは対象外（追加と割り当てのみ）
- ジャンル(複数選択)と保存場所(単一選択)でピッカーが別実装（共有化は将来）
