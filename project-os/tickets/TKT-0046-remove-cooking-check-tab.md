# TKT-0046: モードC「料理・記録」から「レシピ確認」タブを削除し「料理履歴」固定表示にする

## 概要

モードB「献立・レシピ」の「レシピ集」と、モードC「料理・記録」の「レシピ確認」がほぼ同じ表示（レシピ一覧・献立ショートカット）を担っており機能が重複している。
モードCは本来「調理の記録」を行う画面であり、重複する「レシピ確認」タブを削除し「料理履歴」のみを表示する。

## 変更範囲

- `app.html` の `modeCView` 内 HTML（タブ切り替えUI削除）
- `app.html` の JavaScript（`switchCTab`, `renderCookingMode`, `renderCookingCheckTab` の整理）

## 仕様

1. モードC（`modeCView`）の通常表示（`cookingGuide`）から「レシピ確認」「料理履歴」タブボタンを削除
2. 表示内容は常に「料理履歴」（`renderCookingHistoryTab`）とする
3. `state.currentCTab` のデフォルト値を `'history'` に変更
4. `renderCookingCheckTab` 関数は削除（呼び出し元も整理）
5. `getCookingTabTone`, `updateCookingTopTabs`, `switchCTab` は不要となるが、他の参照がないか確認してから削除または最小化
6. `cookingModeLabel` のテキストは固定で `COOKING HISTORY`
7. `cookingContentContainer` の背景クラスは `bg-amber-50...`（履歴用トーン）に固定

## 実装確認事項

- `alert` / `confirm` / `prompt` の新規追加がないこと
- `showToast` 関数が存在すること（既存のまま）
- `GEMINI_API_KEY` 空チェックバリデーションがないこと（既存のまま）
- スプシ書き込み系の新規コードが `syncPendingChanges()` 以外で個別 `executeGAS(payload...)` していないこと（本変更では該当なし）

## テスト/Verify

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```

- 手動: CanvasプレビューでモードCを開き、「料理履歴」が即座に表示されることを確認
- 手動: ボトムナビの「料理・記録」タップでモードCに遷移し、タブ切り替えUIがないことを確認

## ステータス

- spec_ready: true
- implementation_ready: true
