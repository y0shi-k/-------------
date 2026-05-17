---
ticket: TKT-0035-schedule-sort-ingredients-search
status: ready
---

# Report

## 変更目的

Stock Master のスケジュール登録導線を整理し、以下の UX 改善を実施：

1. レシピ選択モーダルにソート機能（追加日時・前回調理日・調理回数・名前）を追加
2. レシピ選択モーダルの検索を材料名にも対応
3. レシピ詳細閲覧モーダルから直接スケジュールに追加できる導線を新設
4. 新規「ミニカレンダー＋食事選択」モーダルで日付と食事を直感的に選択

## これまで不足していた点

- スケジュールの「＋」からレシピを選ぶ際、並び順を変えられず探しにくかった
- 検索がレシピ名のみで、材料名からも探したいユースケースがあった
- レシピを確認した後にスケジュールに入れる導線が遠回り（レシピ集→確認→献立タブ→日付→＋）

## 今回追加した安全装置

- 新規 `SPEC-0035` / `TKT-0035` を追加
- `state` に `scheduleRecipePickerSortBy`, `scheduleRecipePickerSortOrder` を追加
- `state` に `_scheduleAddRecipeId`, `_scheduleAddRecipeName`, `_scheduleAddSelectedDate` を追加
- 既存の「＋」導線はそのまま残し、並行利用可能

## 実施した確認

- 標準 verify: `VERIFY_PASSED`
- `alert`/`confirm`/`prompt` 残存チェック: pass（なし）
- `showToast` 関数存在確認: pass
- `GEMINI_API_KEY` 空チェック: 既存パターンのまま
- スプシ書き込み: `syncPendingChanges()` 以外の個別 `executeGAS` は未追加
- Canvas追加チェック: 既存パターンの再利用、肥大化なし

## 残リスク

- Gemini Canvas への貼り付けプレビューと実GAS通信確認は未実施
- ミニカレンダーモーダルの UI/UX フィードバック待ち
