# Report — TKT-0009

## Status
- ready

## Summary
未同期バー（#syncBar）が各モーダルのボタンと重なる問題を解消しました。

## Changes
- **File**: `app.html`
- **Approach**: モーダルが開いている間は syncBar を非表示にし、モーダルを閉じた際に `updateSyncBar()` で未同期件数に応じて再表示する
- **Scope**: 全8つのモーダル（itemModal, recipeModal, recipeTextModal, aiRequestModal, aiIngredientSelectModal, aiRecipePreviewModal, scheduleRecipeModal, scheduleSlotMenu）

## Implementation Details

### 開く側（8関数）
各モーダルの open 関数先頭に:
```javascript
document.getElementById('syncBar').classList.add('hidden');
```

### 閉じる側（8関数）
各モーダルの close 関数の `setTimeout` 直後に:
```javascript
updateSyncBar();
```

## Verify
- Command: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- Result: VERIFY_PASSED

## Manual Smoke
- 全8モーダルの開閉で syncBar の表示/非表示が正しく動作することをコードレビューで確認
- Canvas環境での手動確認は別途推奨

## Artifacts
- `project-os/artifacts/TKT-0009/verify.json`
- `project-os/artifacts/TKT-0009/manual-smokes.md`
- `project-os/artifacts/TKT-0009/review.md`
- `project-os/artifacts/TKT-0009/report.md`
