# Canvas UI Workflows

## 目的

Canvas版 `app.html` とユーザー提供スクリーンショットを基準に、Web版へ移すべき画面導線を言語化する。

今後の移植判定では「処理がコード上にある」だけでは合格にしない。Canvas版と同じ場所に入口があり、同じ順番で画面・モーダル・確認・保存へ進めることを合格条件にする。

## 判定基準

- `same`: Canvas版と同じ入口、同じ画面遷移、同じ確認導線で使える
- `partial`: 処理はあるが入口、画面、確認、見た目のいずれかが不足
- `changed`: 機能は近いがユーザーの操作導線がCanvas版と違う
- `missing`: 入口または処理がない
- `supabase_replace`: 保存先だけSupabaseへ置換し、体験はCanvas版に合わせる

## 共通フロー

### 起動

- 対応スクショ: なし
- Canvas元コード: `initView`, `handleInit()`, `approveAllAndInit()`
- 表示されるボタン:
  - `アプリを起動`
  - `この会話内はすべて承認`
- フロー:
  1. 初期画面で `アプリを起動` を押す。
  2. GAS/Spreadsheet初期化が走る。
  3. 成功後に下部ナビが表示され、通常画面へ移る。
- Web版方針:
  - GAS初期化は不要。Supabaseログイン後に本人データを読む。
  - ただし「初期読み込み中」「準備完了」「エラー」は見失わない場所に表示する。
- 合格条件:
  - ログイン後、最初の画面で現在のモードと読み込み状態が分かる。

### 上部ステータス / 同期バー / AI処理中

- 対応スクショ: 全体上部に「待機中 | バックグラウンド処理はありません」
- Canvas元コード:
  - `activityStatusBar`
  - `syncBar`
  - `processingOverlay`
  - `beginAiRequest()`, `cancelActiveAiRequest()`, `syncPendingChanges()`
- 表示されるボタン:
  - `キャンセル`、AI処理中だけ表示
  - `破棄`
  - `同期する`
- フロー:
  1. 通常時は上部ステータスが `待機中` を表示する。
  2. 未同期変更があると上部に同期バーが出る。
  3. AI中は全画面オーバーレイが出て、必要なら `キャンセル` できる。
- Web版方針:
  - Supabaseは即時保存が多いため同期バーは完全再現しない。ただしAI処理中、保存中、失敗は常設表示する。
- 合格条件:
  - AI中に画面が沈黙しない。
  - エラー時は「原因」「影響」「修正方法」が読める。

### 下部ナビ

- 対応スクショ: 全スクショ下部
- Canvas元コード: `bottomNav`, `switchMode(mode)`
- 表示されるボタン:
  - `食材管理`
  - `献立・レシピ`
  - `料理・記録`
- フロー:
  1. `食材管理` を押すと Mode A を表示し、`renderList()` が走る。
  2. `献立・レシピ` を押すと Mode B を表示し、`renderRecipeMode()` が走る。
  3. `料理・記録` を押すと Mode C を表示し、調理ビューア中でなければ `renderCookingMode()` が走る。
- Web版で足りないもの:
  - Web版は大きな上部ヘッダーと独自タブが混ざり、Canvas版の細い中央カラムと下部3モード体験から外れている。
- 合格条件:
  - スマホでも常に下部3モードから主要画面へ戻れる。

## 食材管理フロー

### 在庫一覧

- 対応スクショ: 12
- Canvas元コード:
  - `modeAView`
  - `inventoryView`
  - `renderModeControls()`
  - `renderInventoryPrimaryRow()`
  - `renderList()`
  - `filterByLocation(loc)`
- 表示されるボタン:
  - 上部: `食材管理`, `買い物リスト`, `＋`
  - タブ: `すべて`, `使い切り`, `冷蔵庫`, `冷凍庫`, `パントリー`, `ベランダ`, `その他`, `＋ 管理`
  - 並び: `期限順`, `名前順`, `購入日順`
  - 一括: `すべて選択`
  - 各カード: `-`, `+`, 編集, 削除
- フロー:
  1. 下部ナビで `食材管理` を押す。
  2. 上部タブは `食材管理` が選択される。
  3. 保存場所タブで表示を切り替える。
  4. 食材カードの `+/-` で数量を変更する。
  5. 編集アイコンで食材編集モーダルを開く。
  6. 削除アイコンで削除確認を開く。
- 状態変化:
  - Canvas版は数量変更、編集、削除を `state.pendingSync` に積み、手動同期でSpreadsheetへ反映する。
  - Web版はSupabaseへ即時保存してよいが、操作後の見た目はCanvas版に合わせる。
- Web版で足りないもの:
  - 保存場所タブの見た目、件数バッジ、在庫カード密度、Canvas版と同じカード操作配置。
- 合格条件:
  - スクショ12と同じく、食材管理を開くと保存場所タブと在庫カードが最初に見える。

### 買い物リスト

- 対応スクショ: 11
- Canvas元コード:
  - `filterByLocation('買い物リスト')`
  - `renderModeControls()`
  - `renderShoppingRow()`
  - `renderShoppingGrouped()`
  - `bulkPurchase()`
  - `bulkDeleteShopping()`
  - `openShoppingManualModal()`
- 表示されるボタン:
  - 上部: `食材管理`, `買い物リスト`, `＋`
  - 表示切替: `出自別`, `材料まとめ`
  - 並び: `名前順`, `数量順`, `予定日順`
  - 一括: `すべて選択`
  - 空状態: `買うものはありません。`
- フロー:
  1. `買い物リスト` タブを押す。
  2. 買い物用の緑色パネルに変わる。
  3. `出自別` または `材料まとめ` を切り替える。
  4. チェックした項目を購入済み、または削除する。
  5. `＋` から手動追加モーダルを開く。
- Web版で足りないもの:
  - Canvas版と同じ場所に手動追加入口が見えにくい。
  - 出自別/材料まとめの画面密度が一致していない。
- 合格条件:
  - 買い物リスト画面だけで、追加、購入済み、一括削除の入口が分かる。

### 登録待ち / 写真AI解析

- 対応スクショ: なし
- Canvas元コード:
  - `openRegistrationHub()`
  - `filterByLocation('登録待ち')`
  - `renderModeControls()`
  - `batchCompleteFlow()`
  - `batchPredictAI()`
  - `batchRegisterDB()`
  - `batchDeleteStaging()`
  - `scanImageWithAI()`
- 表示されるボタン:
  - `画像スキャン`
  - `手動で追加`
  - `まとめてAI解析して在庫へ追加`
  - `AI解析のみ`
  - `在庫へ追加`
  - `選択削除`
- フロー:
  1. 食材管理上部の `＋` を押す。
  2. 登録待ち画面へ移る。
  3. `画像スキャン` で写真から食材候補を作る。
  4. `手動で追加` で食材追加モーダルを開く。
  5. 候補を確認し、AI期限解析または在庫追加へ進む。
- セキュリティ:
  - Web版では写真を非公開Storageへ保存し、AI APIキーはサーバー側だけで扱う。
- 合格条件:
  - 写真AIの結果が直接在庫確定せず、登録待ちで確認できる。

### 食材追加・編集モーダル

- 対応スクショ: 10
- Canvas元コード:
  - `itemModal`
  - `openModal()`
  - `closeModal()`
  - `handleStagingSave(event)`
  - `handleLocationSelectChange()`
  - `addLocationFromForm()`
- 表示される入力:
  - 品名
  - 分類
  - 保存場所
  - 数量・単位
  - 表示期限
  - 単位換算
  - 購入日
  - 開封日
  - メモ
- 表示されるボタン:
  - `リストに追加`
  - 閉じる
  - 保存場所の `追加`
- フロー:
  1. `＋` または編集からモーダルを開く。
  2. 必須項目を入力する。
  3. `リストに追加` で登録待ち、または在庫更新へ反映する。
- Web版で足りないもの:
  - 現在はフォームが画面内パネル化しており、Canvas版のモーダル体験と違う。
- 合格条件:
  - スクショ10と同じ独立モーダルとして開く。

## 献立・レシピフロー

### レシピ集

- 対応スクショ: 7
- Canvas元コード:
  - `modeBView`
  - `switchBTab('recipes')`
  - `renderRecipeModeControls()`
  - `renderRecipeList()`
  - `openRecipeEditor()`
  - `openRecipeTextModal()`
  - `openAiAddMenuModal()`
- 表示されるボタン:
  - 上部タブ: `レシピ集`, `候補`, `スケジュール`
  - 主要操作: `＋ 新規レシピ`, `テキストから追加`, `AI考案`
  - 検索: `レシピ名`, `食材`, `すべて`, `AND`, `OR`, 検索入力
  - 並び: `登録日時`, `更新日時`, `レシピ名`, `調理回数`, `材料数`
  - カード: 調理開始、編集、削除
- フロー:
  1. 下部ナビで `献立・レシピ` を押す。
  2. `レシピ集` が表示される。
  3. `＋ 新規レシピ` はレシピ編集モーダルへ進む。
  4. `テキストから追加` はテキスト構造化モーダルへ進む。
  5. `AI考案` はAI考案メニューへ進む。
  6. レシピカードを押すとレシピプレビューへ進む。
- Web版で足りないもの:
  - `テキストから追加` が独立ボタンではなく、AIパネル内の `本文を構造化` に埋もれている。
  - レシピ作成フォーム、AI機能、一覧が同じ画面に縦積みされ、Canvas版の確認順序と違う。
- 合格条件:
  - レシピ集の上部に `新規レシピ / テキストから追加 / AI考案` が常に見える。

### テキストから追加

- 対応スクショ: 6
- Canvas元コード:
  - `recipeTextModal`
  - `openRecipeTextModal()`
  - `closeRecipeTextModal()`
  - `parseRecipeTextWithAI()`
  - `openRecipeEditor()`
  - `renderIngredientInputs()`
  - `renderSeasoningInputs()`
  - `renderPrepStepInputs()`
  - `renderCookStepInputs()`
- 表示されるボタン:
  - `AIで構造化`
  - 閉じる
- フロー:
  1. レシピ集の `テキストから追加` を押す。
  2. `テキストからレシピを追加` モーダルが開く。
  3. レシピ本文を貼り付ける。
  4. `AIで構造化` を押す。
  5. AIがレシピ名、出典、材料、調味料、下ごしらえ、調理工程へ分解する。
  6. テキストモーダルを閉じ、レシピ編集モーダルへ結果を反映する。
  7. ユーザーが確認・修正して保存する。
- Web版で足りないもの:
  - 独立入口、独立モーダル、AI後に編集モーダルへ反映する体験。
- 合格条件:
  - ユーザーが「テキストから追加」という文言を見つけて、スクショ6と同じ流れで保存前確認できる。

### AI考案

- 対応スクショ: 5
- Canvas元コード:
  - `aiAddMenuModal`
  - `openAiAddMenuModal()`
  - `startPriorityAiRecipe()`
  - `startSelectedIngredientAiRecipe()`
  - `aiRequestModal`
  - `aiIngredientSelectModal`
  - `consultAiRecipe()`
  - `generateAiRecipeFromPlan()`
  - `generateSelectedRecipe()`
- 表示されるボタン:
  - `優先消費レシピ`
  - `指定食材から`
  - 食材ごとの `考案`
  - `AIに相談する`
  - `この方針でレシピを生成`
  - `レシピを考案`
- フロー:
  1. レシピ集の `AI考案` を押す。
  2. `AI考案で追加` モーダルが開く。
  3. `優先消費レシピ` は期限が近い食材を候補にする。
  4. `指定食材から` は食材選択モーダルへ進む。
  5. 食材選択では検索、並び替え、保存場所/分類フィルタ、必須/任意切替を使う。
  6. AI相談を挟む場合は方針を確認し、生成へ進む。
  7. 生成結果はAIレシピプレビューで確認してから保存する。
- Web版で足りないもの:
  - 優先消費/指定食材/相談/プレビューの画面分岐がCanvas版ほど明確ではない。
- 合格条件:
  - AI考案入口から、スクショ5と同じ2択に入れる。

### レシピ編集モーダル

- 対応スクショ: 4
- Canvas元コード:
  - `recipeModal`
  - `handleRecipeSave(event)`
  - `addIngredientRow()`
  - `addSeasoningRow()`
  - `addPrepStepRow()`
  - `addCookStepRow()`
  - `addCurrentRecipeToShopping()`
- 表示される入力:
  - レシピ名
  - ジャンル
  - 出典
  - 材料
  - 調味料
  - 下ごしらえ
  - 調理工程
- 表示されるボタン:
  - `＋ 材料を追加`
  - `＋ 調味料を追加`
  - `＋ 下ごしらえを追加`
  - `＋ 工程を追加`
  - `キャンセル`
  - `買い物へ`
  - `保存` / `更新`
- フロー:
  1. 新規、編集、AI構造化後のいずれかで開く。
  2. 4区分を確認・修正する。
  3. `買い物へ` で材料を買い物リストに送る。
  4. `保存` または `更新` でレシピ集へ反映する。
- Web版で足りないもの:
  - Canvas版の大きなスクロールモーダル、行追加配置、買い物導線が同等ではない。
- 合格条件:
  - スクショ4と同じく、4区分を1つの編集モーダル内で確認できる。

### スケジュール

- 対応スクショ: 8, 9
- Canvas元コード:
  - `switchBTab('schedule')`
  - `renderSchedule()`
  - `changeScheduleWeek()`
  - `shiftScheduleDays()`
  - `resetScheduleWeek()`
  - `openScheduleRecipePicker(date, meal)`
  - `openScheduleSlotMenu(id)`
- 表示されるボタン:
  - `前の週`
  - `今週`
  - `次の週`
  - `選択モード`
  - 上矢印 / 下矢印
  - 各スロットの `＋`
- フロー:
  1. `スケジュール` タブを押す。
  2. 今日中心の7日分が表示される。
  3. `前の週` / `次の週` / `今週` で期間移動する。
  4. 上下矢印で1日単位に移動する。
  5. 朝昼晩スロットの `＋` でレシピ選択モーダルを開く。
  6. 既存カードを押すと献立スロット操作メニューを開く。
- Web版で足りないもの:
  - Canvas版と同じ縦7日、朝昼晩枠、今日強調、スロット内 `＋` の見た目。
- 合格条件:
  - スクショ8/9と同じく、日付ごとに朝昼晩の空枠と追加ボタンが見える。

### 献立レシピ選択 / 買い物候補選択 / スロット操作

- 対応スクショ: なし
- Canvas元コード:
  - `scheduleRecipeModal`
  - `renderScheduleRecipePickerList()`
  - `shoppingShortageSelectModal`
  - `openShoppingShortageSelectModal()`
  - `scheduleSlotMenu`
  - `startScheduleSlotCooking()`
  - `changeScheduleSlotRecipe()`
  - `removeScheduleSlot()`
- 表示されるボタン:
  - レシピ選択: `名前`, `追加日`, `前回調理`, `調理回数`
  - 買い物候補: `ALL`, `食材`, `調味料`, `表示中をすべて選択`, `選択したものを追加`
  - スロット操作: `調理を開始`, `別のレシピに変更`, `削除する`
- フロー:
  1. スケジュールの `＋` からレシピ選択へ進む。
  2. レシピを選ぶと献立に追加する。
  3. 不足材料があれば買い物候補選択モーダルを開く。
  4. 選択した不足材料だけ買い物リストへ追加する。
  5. 既存スロットを押すと、調理開始、変更、削除を選ぶ。
- Web版で足りないもの:
  - 不足材料のタブ付き選択モーダル、スロット操作メニューのCanvas版配置。
- 合格条件:
  - 献立追加後に、不足材料を確認してから買い物へ送れる。

## 料理・記録フロー

### 料理記録トップ

- 対応スクショ: 1
- Canvas元コード:
  - `switchMode('C')`
  - `renderCookingMode()`
  - `renderCookingRecordDashboard()`
  - `renderCookingRecordSummary()`
  - `renderCookingRecordTabs()`
- 表示される内容:
  - サマリー: `今月`, `今週`, `写真あり`, `よく作る`
  - タブ: `カレンダー`, `タイムライン`, `振り返り`
- フロー:
  1. 下部ナビで `料理・記録` を押す。
  2. 今日ダッシュボード、サマリー、タブが表示される。
  3. 初期表示は履歴ビュー設定に従う。
- Web版で足りないもの:
  - TodayDashboardがWeb版独自の上部常設になっており、Canvas版のMode C内表示と違う。
- 合格条件:
  - スクショ1のように、料理・記録の中でサマリーと振り返りが見える。

### カレンダー

- 対応スクショ: 2
- Canvas元コード:
  - `setCookingHistoryView('calendar')`
  - `renderCookingCalendarView(container)`
  - `selectCookingCalendarDate(date)`
  - `shiftCookingCalendarMonth(delta)`
- 表示されるボタン:
  - 月移動の左右ボタン
  - カレンダー日付セル
  - `レシピを見る`
  - `調理を開始`
- フロー:
  1. `カレンダー` タブを押す。
  2. 月カレンダーを表示する。
  3. 日付セルを押すと、その日の記録と予定を下に表示する。
  4. 予定カードからレシピ閲覧または調理開始へ進む。
- 合格条件:
  - スクショ2と同じく、日付セルに記録、写真、高評価、予定の印が出る。

### タイムライン

- 対応スクショ: 3
- Canvas元コード:
  - `setCookingHistoryView('timeline')`
  - `renderCookingTimelineView(container)`
  - `renderCookingHistoryCard(item)`
  - `renderCookingRecordControls()`
- 表示される入力/ボタン:
  - 検索
  - 期間フィルタ
  - 評価フィルタ
  - 写真フィルタ
  - ジャンルフィルタ
  - 献立枠フィルタ
  - `写真を開く`
  - `レシピを見る`
  - `もう一度作る`
- フロー:
  1. `タイムライン` タブを押す。
  2. 検索/フィルタで履歴を絞る。
  3. 日付ごとに履歴カードを確認する。
  4. `もう一度作る` で調理ビューアへ進む。
- 合格条件:
  - スクショ3と同じく、検索・フィルタ・日付見出し・履歴カードが一画面内にまとまる。

### 振り返り

- 対応スクショ: 1
- Canvas元コード:
  - `setCookingHistoryView('insights')`
  - `renderCookingInsightsView(container)`
  - `renderCookingInsightPanel(title, listHtml)`
- 表示されるパネル:
  - `最近よく作った`
  - `評価が高い`
  - `しばらく作っていない`
  - `ジャンル傾向`
  - `写真で見る今月`
- フロー:
  1. `振り返り` タブを押す。
  2. 料理履歴から自動集計したパネルを見る。
  3. 写真付き履歴があれば月内写真を表示する。
- 合格条件:
  - スクショ1のように、分析カードと写真一覧が表示される。

### 調理ビューア

- 対応スクショ: なし
- Canvas元コード:
  - `openCookingViewer(recipeId, options)`
  - `closeCookingViewer()`
  - `renderCookingIngredients(recipe)`
  - `renderCookingSteps(recipe)`
  - `toggleCookingInventoryCheck()`
  - `highlightIngredientInCooking(name)`
  - `finishCooking()`
- 表示されるボタン:
  - 戻る
  - 在庫トグル
  - 材料/調味料タブ
  - 下ごしらえ/調理工程タブ
  - `料理を完了する`
- フロー:
  1. レシピカード、献立カード、料理履歴から `作る` を押す。
  2. Mode Cの調理ビューアへ切り替わる。
  3. 材料と手順を見ながら調理する。
  4. 手順内の材料名を押すと材料側が強調される。
  5. `料理を完了する` を押す。
- 合格条件:
  - 調理中は料理・記録の通常画面ではなく、調理専用ビューへ切り替わる。

### 消費量調整 / 代替食材選択 / 料理完了記録

- 対応スクショ: なし
- Canvas元コード:
  - `openConsumptionAdjustmentModal(recipeId)`
  - `renderConsumptionList()`
  - `openSubstitutionModal(idx)`
  - `selectSubstitution(id, name)`
  - `openCookingRecordModal(recipeId, scheduleItemId)`
  - `renderStarRating(rating)`
  - `saveCookingRecord()`
- 表示されるボタン:
  - 消費量確認のチェック
  - `代替`
  - 代替食材の選択
  - 星評価
  - 料理履歴保存
- フロー:
  1. 調理ビューアで `料理を完了する` を押す。
  2. 消費量調整モーダルを開く。
  3. 必要なら `代替` で別の在庫を選ぶ。
  4. 在庫減算を確定する。
  5. 料理記録モーダルで写真、評価、感想を入力する。
  6. 保存すると料理履歴へ追加され、予定が完了になる。
- Web版で足りないもの:
  - 消費調整自体はあるが、Canvas版と同じ一連のモーダル導線として確認し直す必要がある。
- 合格条件:
  - 調理完了後、在庫消費と料理履歴保存が分断されず、1本の流れになる。

## Web版移植の実装順

1. 共通フレームをCanvas版へ寄せる。
2. レシピ集の上部導線を復元する。
3. `テキストから追加` と `AI考案` を独立モーダルに戻す。
4. スケジュールの7日/朝昼晩レイアウトを復元する。
5. 食材管理の保存場所タブ、買い物、登録待ちを復元する。
6. 料理・記録の3タブと調理完了フローを復元する。

## セキュリティ注意

- APIキー、Supabase service role key、写真URLはコードに直書きしない。
- AI処理はNext.jsサーバー側API経由にする。
- 写真は非公開Storageを維持し、必要なときだけ署名付きURLで表示する。
- Canvas版のGAS通信はWeb版では再現しない。Supabase Auth/RLSを正本にする。
