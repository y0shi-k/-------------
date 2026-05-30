---
ticket_id: TKT-0143-recipe-schedule-canvas-picker-parity
status: passed
review_scope:
  - TKT-0143-recipe-schedule-canvas-picker-parity
---

# Review Record

## checked_diff_paths

- web/src/components/recipe-meal-workspace.tsx
- web/src/components/inventory-board.tsx
- web/src/components/shopping-list-section.tsx
- web/src/app/globals.css
- web/src/app/page.tsx
- web/src/__tests__/recipe-meal-workspace.test.tsx
- web/src/__tests__/inventory-board.test.tsx

## checked_artifacts

- project-os/artifacts/TKT-0143/verify.json
- project-os/artifacts/TKT-0143/manual-smokes.md

## subagent_usage

- none

## findings

- 予定が入ったカードの操作はセル内展開をやめ、カードタップで開く中央モーダル（献立の操作: 前日/翌日/調理完了/削除＋消費量エディタ）へ変更。Canvas `scheduleSlotMenu` の方式に一致し、狭いセルからのはみ出し（レイアウト崩れ）が解消。`moveSchedule`/`completeSchedule`/`deleteSchedule`/消費フローのロジックは不変。
- 買い物まわりをスケジュール画面から撤去し、買い物リスト管理（手動追加・購入済・選択削除・未購入/購入済一覧）を `InventoryBoard` の「買い物リスト」タブ（従来は無効スタブ）に実装。Canvasで買い物が食材管理側にある構成に一致。共有 `ShoppingListSection` を新設して両画面の重複を排除。
- 買い物の書き込み（insert/update/delete）はすべて `user_id`(本人ID) 付きで `shopping_items` に対して実行。テーブル/列/RLSは不変。書き込み後 `router.refresh()` で画面間の表示を同期。
- レシピ詳細からの不足材料→買い物追加（`addCurrentRecipeToShopping`/`confirmRecipeShortageSelection`）は残置し機能維持。スケジュール側の冗長な不足食材パネルのみ撤去。
- 盤面JSXがCanvas版 `renderSchedule` の構造（独立日カード＋幅64pxの日付バッジ＋朝昼晩3等分スロット＋スロット内＋ボタン＋上下の1日送りバー）に一致している。
- 日付トーン `scheduleDateTone()` が today/sun/sat/weekday を返し、`data-tone` でCSS着色。今日=オレンジ塗り＋「今日」、土=青、日=赤、平日=灰でCanvasと整合。
- 追加導線はクイック追加フォームを廃し、セルの＋→レシピピッカー（`.modal-backdrop`+`.canvas-modal` 既存流儀、検索付き）へ統一。`addScheduleEntry(date, meal, recipeId)` を新設し、ピッカーと料理画面の「献立へ追加」フォーム（薄いラッパ `saveSchedule`）が共有。
- データ保護面の確認（重点）:
  - 献立insertは `meal_schedules` へ `user_id: userId` を付与し、列構成は従来どおり。本人以外のデータに触れる変更はない。
  - Supabase schema / migration / RLS policy / auth / Storage への変更は diff に存在しない（UIとCSSとテストのみ）。
  - `meal_schedules` という語は既存の `supabase.from(...)` 呼び出しに由来し、スキーマ定義の追加・変更ではない。
- 既存挙動の温存: `moveSchedule` / `completeSchedule` / `deleteSchedule` / `requestDelete` / `ConsumptionEditor` は変更なし。操作ボタンは選択時のみ展開する形に変えたが、ハンドラ・引数は不変。
- テストは新UIに合わせて更新（ピッカー経由の追加、`予定なし` アサーション削除）し、53/53 成功。lint/typecheck/build もpass。
- コーディング規約: stateはイミュータブル更新、未使用varなし（`mealTypes`/`scheduleDate` 等は料理画面の候補フォームで継続使用）。

## open_risks

- 旧スケジュールCSS（`.meal-week` / `.meal-day` 等）は他クラスとの共用回避のため残置（dead CSS）。無害だが将来の整理候補。
- 狭幅端末で選択時の操作ボタンが縦積みになり行が高くなる（選択時のみ）。
- ドラッグ＆ドロップ並べ替え・選択モード一括削除は未実装（対象外。移動は前日/翌日で担保）。

## verdict

実装はチケットの受け入れ条件を満たし、Canvas版とのスケジュール画面の見た目整合が大きく向上した。データベース構造・権限・認証・Storageへの変更は無く、データ保護面のリスクは無い。verify全pass・テスト全passを確認。承認。
