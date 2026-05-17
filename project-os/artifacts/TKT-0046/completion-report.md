# TKT-0046 完了報告

## 実装内容

モードC「料理・記録」の「レシピ確認」タブを削除し、「料理履歴」のみを表示するように変更した。

### 背景
モードB「献立・レシピ」の「レシピ集」と、モードCの「レシピ確認」がほぼ同じ表示（レシピ一覧・献立ショートカット・開始ボタン）を担っており機能が重複していた。モードCは本来「調理の記録」を行う画面であるため、重複部分を削除して履歴表示に一本化した。

### 変更箇所

**`app.html`**

1. **HTML構造変更**
   - `cookingModeTopTabs`（「レシピ確認」「料理履歴」の2タブボタン）を削除
   - `cookingContentContainer` の背景クラスを `bg-emerald-50...` から `bg-amber-50...`（履歴用トーン）に固定

2. **JavaScriptロジック変更**
   - `state.currentCTab` のデフォルト値を `'check'` → `'history'` に変更
   - `switchCTab()` を削除（呼び出し元もHTMLから削除済み）
   - `getCookingTabTone()` を削除
   - `updateCookingTopTabs()` を削除
   - `renderCookingCheckTab()` を削除
   - `getLocalDateString()` を削除（`renderCookingCheckTab` 内でのみ使用）
   - `renderCookingScheduleCard()` を削除（`renderCookingCheckTab` 内でのみ使用）
   - `renderCookingMode()` を簡略化し、常に `renderCookingHistoryTab()` を呼ぶように変更
   - `loadCookingHistoryImages()` 内の `state.currentCTab !== 'history'` 条件を削除（タブがなくなったため常に履歴表示）

### Verify結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# => VERIFY_PASSED
```

Canvas環境追加チェック:
- `alert(` / `confirm(` / `prompt(` 残存なし ✅
- `showToast` 関数存在 ✅
- `GEMINI_API_KEY` 空チェックバリデーションなし（既存のまま）✅
- スプシ書き込み系の新規個別 `executeGAS` 呼び出しなし（本変更では該当なし）✅

## 影響範囲

- モードCの通常表示（`cookingGuide`）が常に「料理履歴」表示になる
- 調理ビューア（`cookingViewer`）への影響はなし
- モードA（食材管理）、モードB（献立・レシピ）への影響はなし
- ボトムナビゲーションからモードCへ遷移した際の表示が「料理履歴」に自動的に切り替わる
