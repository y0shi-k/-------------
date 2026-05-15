# TKT-0011 Report

## Summary

買い物リストに手動追加、一括削除、出自表示、材料まとめ表示を追加した。保存単位は出自別明細のまま維持し、画面側で `出自別` と `材料まとめ` を切り替えられる。

## Changes

- 買い物リストシートに `出自種別`, `予定日`, `食事区分` を追加。
- 手動追加、レシピ詳細由来、献立スケジュール由来の出自を保存。
- `pendingSync.shoppingDeletes` を追加し、削除を一括同期に統合。
- 買い物リストの行サイズを在庫リストに合わせた。
- 材料まとめ表示では同じ `品名 + 単位` を合算し、トグルで明細を展開可能にした。

## Verification

- HTML parse / `executeGAS` / `GAS_URL`: PASS
- JavaScript parse: PASS
- GAS書き込みポリシー静的確認: PASS

## Follow-up

- Gemini Canvas実機でGAS同期とSpreadsheet列補完を確認する。
