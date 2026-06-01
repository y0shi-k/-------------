---
id: TKT-0148-cooking-completion-consumption-photo-web
title: 献立からの調理完了フローで消費量調整モーダルを確実に表示し、Canvas相当に拡張したうえで完成写真＋評価＋コメントを記録できるようにする
status: ready
goal: 「料理を完了する」後に消費量調整モーダルが全画面調理ビューアの裏に隠れて見えない不具合（z-index）を解消し、Canvas版と同等の消費量調整UI（チェックボックス選択・全選択/全解除・カテゴリタブ・在庫不足警告）に拡張し、同モーダル内で完成写真・評価★・コメントを入力して在庫減算と料理履歴に一括保存できるようにする
acceptance:
  - 献立 →「調理を開始」→ 全画面調理ビューア下部の「料理を完了する」を押すと、消費量調整モーダルが調理ビューアの「前面」に表示される（裏に隠れない）
  - 消費量調整モーダルは Canvas相当：材料ごとにチェックボックス（確定対象の選択）、「全選択 / 全解除」、カテゴリタブ（全 / 食材 / 調味料）、在庫不足の警告表示を備える
  - 同モーダル内で完成写真（任意・カメラ起動可）、評価★1〜5（任意）、一言コメント（任意）を入力できる
  - 「確定」を押すと、チェック済みの行のみ在庫を減算し、献立を完了にし、料理履歴を作成する（rating＝入力値 or null、note＝コメント or 既定文言）。写真があれば Storage にアップロードし photos テーブルに cooking_history と紐付けて保存する
  - 写真なしでも完了できる。写真アップロードのみ失敗した場合でも在庫減算・献立完了・履歴作成は保持し、写真分だけ非致命の警告を出す（料理履歴は写真なしで残る）
  - 確定成功時は可視トースト（既存 showToast）で完了を通知し、モーダルと調理ビューアを閉じ、写真・評価・コメント・ドラフトをリセットする
  - 「キャンセル / ×」で消費量モーダルを閉じても在庫・履歴は一切変更されず、入力（写真/評価/コメント）はリセットされる
  - 完了済み献立に紐づく完成写真は、料理・記録（料理履歴）画面の該当カードにそのまま表示される（既存 photos 紐付けの再利用で自動的に反映）
  - Web版verify（lint / typecheck / build）が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
  - photo_upload_storage
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0148/
related_specs:
  - SPEC-0125-cooking-completion-consumption-web
  - SPEC-0108-cooking-history-photo-web
  - SPEC-0058-consumption-substitution-tabs
  - SPEC-0021-cooking-record-modal
related_artifacts:
  - artifacts/TKT-0148/verify.json
  - artifacts/TKT-0148/report.md
  - artifacts/TKT-0148/manual-smokes.md
  - artifacts/TKT-0148/review.md
owner_role: implementer
owner_notes:
  - 危険変更（photo_upload_storage）。完了フロー内に「新規の Supabase Storage 写真アップロード処理」を追加するため、必須成果物は verify.json + report.md に加えて manual-smokes.md / review.md。required_gates に manual_smokes_done / review_ready を含める
  - スキーマ変更なし。photos テーブルは usage_type default 'cooking_history'（CHECK制約なし）/ cooking_history_id 紐付け / photos_user_history_idx を既に持つ（supabase/migrations/20260523094705_schema_v1.sql:130-156）。マイグレーション不要・RLS/Storageポリシー不変
  - 写真処理は既存の web/src/lib/photos/compress.ts（compressImageFile / buildCookingHistoryPhotoStoragePath）と cooking-history-board.tsx:215-362 の保存パターン（compress → storage.upload → photos.insert → 失敗時 storage.remove）をそのまま流用。新しいヘルパー・バケット・usage_type は追加しない
  - 在庫減算・献立完了・料理履歴作成・消費イベント記録は既存 completeSchedule（recipe-meal-workspace.tsx:992-1136）を土台に拡張する。新しい在庫操作APIは作らない
  - Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きしない。Storage非公開（署名URL運用）は維持
  - 承認済み計画: ~/.claude/plans/swirling-sparking-horizon.md（参考）。ユーザー確定事項: ①写真は消費量モーダルに統合（別モーダルにしない） ②記録は写真＋評価＋コメント ③消費量UIはCanvas相当に拡張
---

# Summary

献立から「調理を開始」→ 全画面の調理ビューア（`cooking-overlay` + `CookingViewer`）下部の「料理を完了する」を押したとき、**消費量調整モーダルが表示されず「完了になるだけで何も起こらない」ように見える**不具合を解消する。あわせて消費量調整UIを Canvas版相当に拡張し、同じモーダル内で完成写真・評価★・コメントを記録できるようにする。

## 背景と root cause（重要）

ロジックは既に存在する。`completeSchedule`（`recipe-meal-workspace.tsx:992-1136`）は二段階フロー：

1. 1回目クリック：`pendingConsumptionScheduleId` をセットし `buildConsumptionDrafts(schedule)` でドラフト生成（`recipe-meal-workspace.tsx:998-1004`）。これにより消費量モーダル（`recipe-meal-workspace.tsx:1190-1218`、`ConsumptionEditor` を内包）が条件レンダリングされる。
2. モーダル内「確定」→ 再度 `completeSchedule` → `pendingConsumptionScheduleId === schedule.id` 分岐で在庫減算（`inventory_items.update`）→ 献立 `status="完了"` → `cooking_history` 挿入 → `cooking_consumption_events` 挿入（`recipe-meal-workspace.tsx:1035-1135`）。

**それでも画面に出ない理由（確定済み）：**
- 消費量モーダルの背景 `.modal-backdrop` は `z-index: 80`（`globals.css:1305-1314`）。
- 全画面・不透明（`background:#f8fafc`）・`inset:0` の `.cooking-overlay` は `z-index: 85`（`globals.css:2491-2499`）。
- モーダルは調理ビューアの**裏に完全に隠れる**。さらに 1回目クリックの案内 `setFeedback({tone:"info",...})` は `sr-only`（`recipe-meal-workspace.tsx:1246-1250`）で画面に出ない。→ ユーザーには「押しても何も起こらない」と見える。

加えて現状の `ConsumptionEditor`（`recipe-meal-workspace.tsx:2072-2132`）は「減らす在庫の select ＋ 消費量入力」のみで、Canvas版にある選択チェックボックス・全選択/全解除・カテゴリタブ・在庫不足警告がない。完了フローに写真記録もない。

## 実装メモ（手順）

### 1. z-index 修正（最優先・これだけで「見えない」は解消） — `web/src/app/globals.css`
- `.consumption-backdrop`（`globals.css:2946-2949`）に `z-index: 90;` を追加し、`.cooking-overlay`（85）より前面にする。
- 他のモーダル（テキスト取り込み/AI考案/レシピ編集）は調理ビューアと同時表示されないため `.modal-backdrop` の `z-index:80` は据え置く（消費量モーダルだけ上書き）。

### 2. ConsumptionDraft に選択状態を追加 — `web/src/components/recipe-meal-workspace.tsx`
- 型 `ConsumptionDraft`（`:54-60`）に `selected: boolean` を追加。
- `buildConsumptionDrafts`（`:535-549`）：各ドラフトに `selected` を付与。既定は「該当在庫があり消費量>0」のとき `true`（＝ `Boolean(exactStock) && Number(amount) > 0`）、それ以外 `false`。
- `updateConsumptionDraft`（`:551-553`）は partial 更新なのでそのまま `selected` 変更にも使える。

### 3. ConsumptionEditor を Canvas相当に拡張 — `web/src/components/recipe-meal-workspace.tsx:2072-2132`
Canvas版の対応UI（`app.html`：`consumptionModal` / `renderConsumptionList` / `validateConsumptionInputs`）を参考に以下を実装：
- **カテゴリタブ（全 / 食材 / 調味料）**：親 state `consumptionTab: "all" | "食材" | "調味料"` を新設し props で受け渡し。各ドラフトの `ingredient.item_type`（`recipe.ingredients` から検索、既存 `:2100` のロジック流用）でフィルタ。
- **チェックボックス（行ごと）**：`draft.selected` をバインドし `onChange(index, { selected })`。
- **全選択 / 全解除**：現タブで表示中の行に対して一括で `selected` を切り替える親ハンドラ（例 `setVisibleConsumptionSelected(selected: boolean)`）を追加。
- **在庫不足警告**：選択行ごとに、`stockItemId` の在庫数量（`inventoryItems` から取得）に対して `Number(draft.amount) > stock.quantity` なら不足。不足材料名を集約して警告バナー（例 `consumption-shortage` クラス）で表示。確定はブロックしない（既存 `Math.max(0, ...)` で在庫は0止まり）。
- 既存の「減らす在庫」select（同カテゴリ・同単位・数量>0でフィルタ：`:2101-2103`）は維持。これが Canvas の「代替品選択」を兼ねる。
- 注：Canvas の単位変換手動入力（`cons-manual-qty` / `convertUnitAmount`）は**本チケットの対象外**。現モデルは select を同単位の在庫のみに絞っており、単位変換テーブルは未導入のため（導入は別チケット。SPEC-0059-inventory-unit-conversion 参照）。「残リスク」に明記する。

### 4. 完成写真＋評価＋コメントを消費量モーダルに統合 — `web/src/components/recipe-meal-workspace.tsx`
消費量モーダル（`:1190-1218`）の `ConsumptionEditor` と「確定/キャンセル」アクションの間に記録入力エリアを追加する。実装は `cooking-history-board.tsx` の確立パターンを流用：
- **写真**：`<input type="file" accept="image/*" capture="environment" ref={cookingPhotoInputRef} onChange={selectCookingPhoto} />` ＋ プレビュー（`URL.createObjectURL`）。`selectCookingPhoto` / `resetCookingPhoto` は `cooking-history-board.tsx:198-232` を踏襲（画像判定・object URL 解放・state 更新）。アンマウント/差し替え時の `URL.revokeObjectURL` は `cooking-history-board.tsx:192-196` の useEffect を踏襲。
- **評価★**：state `cookingRating: string`（""＝未設定）。1〜5の選択UI（既存の料理履歴の評価UIに合わせる）。
- **コメント**：state `cookingComment: string`。textarea。
- いずれも任意。写真/評価/コメントが空でも確定可能。

新規 state（コンポーネント上部の他 state 群に追加）：
`selectedCookingPhoto: File | null`、`cookingPhotoPreviewUrl: string | null`、`cookingPhotoInputRef = useRef<HTMLInputElement>(null)`、`cookingRating: string`、`cookingComment: string`、`consumptionTab`。
import 追加：`compressImageFile`, `buildCookingHistoryPhotoStoragePath`（`@/lib/photos/compress`、`cooking-history-board.tsx` と同じ参照）と必要な型（`ChangeEvent`）。`useRef`/`useEffect` は既存 import を確認。

### 5. 確定処理（completeSchedule）の拡張 — `web/src/components/recipe-meal-workspace.tsx:992-1136`
2回目分岐（在庫減算以降）を次のように拡張：
- **対象行**：`consumedRows` の抽出条件（`:1024-1033`）を `draft.selected && draft.stockItemId && draft.consumedAmount > 0` に変更（チェック済みのみ）。バリデーション（`:1010`）も選択行に対して行う。
- **cooking_history 挿入**（`:1070-1082`）：`note` を `cookingComment.trim() || "献立から調理完了"`、`rating` を `cookingRating ? Number(cookingRating) : null` に変更。rating は 1〜5 の整数のみ許可（不正は確定前にエラー表示。`cooking-history-board.tsx:255-262` のバリデーションを踏襲）。
- **消費イベント**（`:1097-1121`）：選択行ベースになる点以外は現状維持。
- **写真アップロード（新規・cooking_history 挿入成功後）**：`selectedCookingPhoto` があれば `cooking-history-board.tsx:298-361` を踏襲し、
  1. `compressImageFile(selectedCookingPhoto)`
  2. `buildCookingHistoryPhotoStoragePath(userId)` → `supabase.storage.from("photos").upload(path, blob, { contentType, upsert:false })`
  3. `supabase.from("photos").insert({ user_id:userId, bucket_id:"photos", storage_path, usage_type:"cooking_history", cooking_history_id: historyData.id, content_type, byte_size, width, height })`
  4. 失敗時：storage.upload 後の photos.insert 失敗なら `storage.remove([path])` でロールバック。**いずれの写真エラーも非致命**（在庫・献立・履歴は保持済み）→ 可視の警告メッセージ（例：「写真の保存に失敗。料理履歴は写真なしで保存済み」）。
  - この画面では写真を再表示しないため `createSignedUrl` は不要（料理・記録画面が `app/page.tsx` で署名URLを取得して表示する）。
- **isSaving の扱い**：現状 `setIsSaving(false)` が cooking_history 挿入直後（`:1084`）にある。写真処理完了まで保存中状態を維持するため、`setIsSaving(false)` を写真処理後（成功・各エラー分岐の末尾）に移動する。各 early return での `setIsSaving(false)` 漏れに注意。

### 6. リセット & クリーンアップ — `web/src/components/recipe-meal-workspace.tsx`
- 確定成功末尾（`:1130-1135`）とキャンセル/×（`:1196`, `:1209`）の両方で、写真（`resetCookingPhoto` 相当：object URL 解放＋input.value クリア）・`cookingRating`・`cookingComment`・`consumptionDrafts`・`pendingConsumptionScheduleId` をリセット。
- 成功通知は既存 `showToast(..., "success")`（可視トースト：`:1140-1144`）を継続使用。1回目クリックの sr-only 案内（`:1002`）は、モーダルが前面表示されることで不要だが残置可（任意で削除）。

### 7. CSS 追加 — `web/src/app/globals.css`
- z-index 修正（手順1）。
- 追加UI（チェックボックス列・タブ・全選択ボタン・不足警告バナー・写真ピッカー/プレビュー・評価★・コメント）のスタイル。可能な限り既存クラス（消費量モーダル `consumption-*`、料理履歴の写真/評価系クラス）を流用し、新規クラスは最小限に。

## 非対象（スコープ外）

- 単位変換の手動入力（Canvas `cons-manual-qty` / `convertUnitAmount`）。在庫単位変換テーブルが未導入のため別チケット（SPEC-0059）。今回は同単位の在庫のみ select 対象。
- 料理・記録（履歴）画面側のUI変更（写真表示は既存の photos 紐付けで自動反映されるため不要）。
- 在庫消費の数量の一括処理API化・トランザクション化（既存の逐次 update を踏襲。部分失敗時の挙動は現状維持で「残リスク」に記載）。

## 検証

- `/verify TKT-0148`（`web/` で lint / typecheck / build）でエラー0。特に新規 state/import の no-unused-vars、`completeSchedule` の早期 return での `setIsSaving` 整合を確認。
- 手動スモーク（dev・要 `manual-smokes.md`）：
  1. 献立 →「調理を開始」→「料理を完了する」で**消費量モーダルが前面に出る**（調理ビューアの裏に隠れない）。
  2. タブ（全/食材/調味料）切替・チェックボックス・全選択/全解除が機能する。
  3. 在庫より多い消費量で不足警告が出る。確定すると該当在庫が0で止まる。
  4. 写真なしで確定 → 在庫減算・献立完了・料理履歴作成を確認。
  5. 写真あり＋評価＋コメントで確定 → photos に cooking_history_id 紐付けで保存され、料理・記録画面の該当カードに写真・評価・コメントが表示される。
  6. キャンセル/×で在庫・履歴が一切変わらず、入力がリセットされる。
- 写真Storage（危険変更）確認：Storage 非公開のまま／パス先頭セグメントが userId（RLS）／photos.insert 失敗時に storage から削除されること。

## 残リスク

- 在庫減算は複数 `inventory_items.update` の逐次実行（`:1035-1047`）で、途中失敗時は部分更新の可能性（既存仕様のまま）。本チケットでは変更しない。
- 写真アップロードのみ失敗時、料理履歴は写真なしで残る（意図通り・非致命）。後から写真を追加するUIは料理・記録画面側に依存（別途検討）。
- 単位が異なる在庫は select 候補に出ない（単位変換は対象外）。Canvas の手入力相当が必要なら後続チケットで対応。
