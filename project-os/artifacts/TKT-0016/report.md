# TKT-0016 完了報告

## タイトル
AI食材選択モーダル拡張（検索・ソート・フィルタ・ジャンル分類）

## 実装日
2026-05-15

## 変更ファイル
- `app.html`

## 変更内容

### 1. 在庫管理：分類選択肢の拡張
- `<select id="f-type">` に以下を追加（既存の「食材」「調味料」はそのまま残す）
  - `野菜`
  - `肉`
  - `魚`
  - `乳製品`
  - `穀物`
  - `その他`

### 2. 食材選択モーダル（`aiIngredientSelectModal`）の強化
- **検索欄** (`aiIngredientSearch`)：食材名でのリアルタイム絞り込み
- **ソート切り替え** (`ai-sort-btn`)：名前・購入日・期限、昇降切り替え可能
  - 在庫管理側の `sortBy`/`sortOrder` と干渉しない専用変数 (`aiIngredientSort`, `aiIngredientSortOrder`) で管理
- **保存場所フィルタ** (`aiIngredientLocFilter`)：在庫から動的に保存場所一覧を取得し選択肢を構築
- **ジャンル（分類）フィルタ** (`aiIngredientTypeFilter`)：新規追加した分類すべてを選択肢に含む

### 3. `renderAiIngredientList()` の拡張
- 検索テキスト → 保存場所フィルタ → ジャンルフィルタ → ソート の順で処理
- 該当なし時のメッセージ表示
- 期限色分け（赤・黄）をそのまま保持
- 各行に分類ラベルも表示

## Verify 結果

```bash
$ python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
VERIFY_PASSED
```

- `alert`/`confirm`/`prompt`：0個
- `showToast`：存在
- `syncPendingChanges`：使用継続中
- 新規スプシ書き込みコードは `syncPendingChanges()` 以外で個別 `executeGAS(payload...)` していない
- `f-type` `<option>` 拡張済
- `aiIngredientSelectModal` 内に検索・ソート・フィルタ要素存在
- `renderAiIngredientList` に検索・フィルタ・ソートロジック存在

## 手動スモークテスト項目
（Gemini Canvas プレビュー時に確認）
- [ ] 在庫登録フォームで「野菜」「肉」など新しい分類が選択できる
- [ ] 「指定食材から」ボタンでモーダルを開くと、検索欄・ソートボタン・フィルタセレクトが表示される
- [ ] 検索欄に入力すると食材名でリアルタイム絞り込まれる
- [ ] ソートボタン（名前・購入日・期限）を押すと順序が変わり、再度押すと昇降が反転する
- [ ] 保存場所フィルタで在庫の保存場所が選択でき、絞り込まれる
- [ ] ジャンルフィルタで「野菜」「肉」などが選択でき、絞り込まれる
- [ ] 在庫管理側のソート状態がモーダルのソートと干渉しない

## 修正（2026-05-15 追記）

### 4. 検索・フィルタ中の選択状態保持 UX 改善
不具合：検索でフィルタ後にチェックを入れ、別の検索に切り替えると前のチェックが外れていた。

対応：
- `aiIngredientSelectedIds` (Set) を導入し、選択状態を DOM ではなくメモリ上で保持
- 検索・ソート・フィルタ変更時も選択状態が維持される
- 各行の checkbox は `renderAiIngredientList()` 描画時に Set の状態で `checked` を復元
- クリック時は `toggleAiIngredientSelection()` で Set を更新し、該当 checkbox のみ再描画（全体再描画しない）

### 5. 選択済み食材の可視化
- モーダル下部に「選択済み」タグエリアを追加
- 選択した食材名がタグ（バッジ）形式で常に表示される
- 各タグに × ボタンをつけ、クリックで直接解除可能（検索し直す必要なし）
- 「すべて解除」ボタンで一括クリア
- 「レシピを考案」ボタンに選択件数を表示（例: "レシピを考案 (3)"）
- モーダルを閉じると選択状態はリセット（次回開くときにクリーンな状態）

## Verify 結果（修正後）

```bash
$ python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
VERIFY_PASSED
```

- `alert`/`confirm`/`prompt`：0個
- `showToast`：存在
- `syncPendingChanges`：使用継続中
- 新規スプシ書き込みコードは `syncPendingChanges()` 以外で個別 `executeGAS(payload...)` していない

## 手動スモークテスト項目（修正後）
（Gemini Canvas プレビュー時に確認）
- [ ] 在庫登録フォームで「野菜」「肉」など新しい分類が選択できる
- [ ] 「指定食材から」ボタンでモーダルを開くと、検索欄・ソートボタン・フィルタセレクトが表示される
- [ ] 検索欄に「キャベツ」と入力しチェックを入れる
- [ ] 検索欄を空にしたり、別の検索語に変えても、キャベツのチェックが保持されている
- [ ] モーダル下部に「選択済み」エリアが表示され、キャベツのタグが表示される
- [ ] タグの × ボタンを押すと選択が解除され、チェックも外れる
- [ ] 複数食材を選択すると、「レシピを考案 (N)」に件数が反映される
- [ ] ソート・フィルタ変更中も選択状態が維持される
- [ ] 「すべて解除」を押すと選択がすべてクリアされる
- [ ] 在庫管理側のソート状態がモーダルのソートと干渉しない

## 備考
- 既存データ（type='食材'）はそのまま。新規追加の分類は今後の登録・編集から利用可能。
- テスト段階でデータを削除して再登録する場合、新しい分類が使えるようになる。
