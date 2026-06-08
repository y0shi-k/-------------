---
ticket_id: TKT-0211-recipe-schedule-add-inventory-shortage
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

TKT-0210 で実装したレシピ起点のスケジュール登録フロー（レシピ詳細ヘッダー／各カード → 30日ミニカレンダー
→ 朝/昼/晩選択 → 登録）に、Canvas版 `app.html` 相当の「登録時に在庫を確認する」UX を結線した。
献立登録が成立した直後にそのレシピの在庫不足を判定し、不足があれば既存の不足選択モーダル（shortage モーダル）
を開いて、選択した材料を買い物リストへ追加できるようにした（`web/src/components/recipe-meal-workspace.tsx`）。

新規のDB書き込み導線・スキーマは作らず、既存資産（`compareRecipeWithInventory` / 不足選択モーダル /
`confirmRecipeShortageSelection` による `shopping_items` INSERT）を**呼ぶだけ**の結線に留めた。

**追補（ユーザー指摘反映）**: 当初はレシピ起点フロー限定（スケジュール「＋」は非ゴール）だったが、
ユーザーから「スケジュール今週画面の＋からの追加でも不足チェックを通したい」との要望を受け、
不足チェックを共通ヘルパー `openShortageModalForScheduledRecipe` に抽出し、レシピ選択モーダル（picker）
からの**新規追加**（`addScheduleFromPicker`）にも同じ結線を適用した。スロットの「別のレシピに変更」
（replace 経路）は対象外のまま。

## 今回追加した安全装置

- 既存 `addScheduleEntry` の戻り値を `Promise<boolean>`（成功=true / 失敗=false）に変更。既存呼び出し
  （`saveSchedule` / pickerSlot からの登録）は戻り値を無視するため挙動は不変（非破壊）。
- 在庫不足チェックは共通ヘルパー `openShortageModalForScheduledRecipe` に集約し、レシピ起点フロー
  （`assignScheduleFromRecipe`）とスケジュール「＋」のレシピ選択モーダルからの**新規追加**
  （`addScheduleFromPicker`）の両方で、登録**成功時のみ**実行。スロットの「別のレシピに変更」（replace）と
  クイック追加フォーム（`saveSchedule`）には付けていない。
- スケジュール登録の成否と買い物追加を独立化。買い物追加を「あとで」で閉じても献立は登録済みのまま。
- `assignScheduleFromRecipe` 内で `recipeId` を `addScheduleEntry` 呼び出し前に控える
  （成功時に `addScheduleEntry` が `scheduleAddRecipeId` を null へ戻すため、不足判定の対象を取りこぼさない）。
- danger eval 誤検出回避: 買い物INSERTは既存 `confirmRecipeShortageSelection` を呼ぶだけで、本diffに
  `.from("shopping_items")` 等のテーブル直叩き・Storage/migration を新規に追加していない（git diff で確認済み）。

## 実施した確認

- `/verify TKT-0211`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。
  policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）も pass。
  結果は `project-os/artifacts/TKT-0211/verify.json`。
- 単体テスト（`web/src/__tests__/recipe-meal-workspace.test.tsx`、計52件 pass）に5件追加:
  - レシピ起点: 登録成立後に不足モーダルが開き、選択 → 既存 `confirmRecipeShortageSelection` 経由で
    `shopping_items` に玉ねぎ（不足1個）が INSERT されること。
  - レシピ起点: 不足モーダルを「あとで」で閉じても買い物追加は走らず、献立登録は成立していること。
  - レシピ起点: 在庫が足りる場合（玉ねぎ在庫2個）は不足モーダルを開かないこと。
  - スケジュール「＋」: picker からの新規追加でも不足モーダルが開き `shopping_items` へ INSERT されること。
  - スケジュール「＋」: 「別のレシピに変更」（replace）では不足モーダルを開かないこと。
- 既存 TKT-0210 テスト（レシピ詳細ヘッダー／カードからの登録）はそのまま pass（不足モーダルが重なっても
  「献立に追加しました。」フィードバックと登録 insert の assertion は不変）。
- git diff にテーブル直叩き・Storage/migration の新規追加が無いことを確認。

## 残リスク

- 登録直後にモーダルを重ねて開くタイミング制御（スケジュール追加モーダルを閉じてから不足モーダルを開く順序）は
  状態更新ベースで実装。実機での視覚的な重なり/ちらつきは手動スモークで要確認（チケット残リスク踏襲）。
- check-gates が `supabase_schema_change` / `photo_upload_storage` を語彙過剰マッチで危険判定するが、実schema・
  実Storageは無変更。既存INSERT/比較関数の再利用のみで非危険（TKT-0210 と同様、軽量プロセスで完了）。

## 次の依頼や人判断

- 実機スモーク: レシピ起点で献立登録 → 不足モーダルの表示・重なり・タブ（ALL/食材/調味料）・全選択/個別選択・
  「選択したものを追加」での買い物リスト反映、および「あとで」キャンセル時に献立が残ることの目視確認。
