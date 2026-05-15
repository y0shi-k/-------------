# TKT-0007 Verify Report

Date: 2026-05-15
Ticket: TKT-0007-shopping-list-integration.md
Spec: SPEC-0007-shopping-list-integration.md

## Verify Results

### HTML Syntax Check
```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
```
Result: **VERIFY_PASSED**

### Canvas Environment Checks
- `alert(` / `confirm(` / `prompt(`: **Not found** (OK)
- `showToast` function: **Exists** (OK)
- `showToastWithAction` function: **Exists** (newly added)
- Individual GAS writes outside `syncPendingChanges()`: **None found** (OK)
  - `loadSchedule()` and `handleInit()` are read-only GAS calls
  - All write operations (inventory, recipe, schedule, shopping) go through `syncPendingChanges()`

### Code Pattern Checks
- Reuses existing `state.pendingSync` + `syncPendingChanges()` batch sync pattern
- Reuses existing modal patterns and `escapeHtml()` utility
- No code bloat detected

## Implementation Summary

### State Management
- Extended `pendingSync` with `shoppingCreates: []`
- Extended `getPendingSyncCount` and `updateSyncBar` to count shopping items
- Extended `syncPendingChanges` GAS payload with:
  - `readShopping()` helper already existed
  - `shoppingCreates` processing: merge same-name+same-unit unbought items (qty add), or append new row with UUID

### Comparison Logic
- `compareRecipeWithInventory(recipeId)`:
  - Parses recipe `ingredients` JSON
  - Scans `state.inventory` for exact name+unit match
  - Sums stock quantities
  - Returns shortage list when stock < required amount
  - Handles unit mismatch as separate items (no conversion)
- `addShortagesToShopping(shortages)`:
  - Calls `queueShoppingCreate()` for each shortage
  - Also pushes to `state.shopping` for immediate UI update

### Auto-Trigger (Meal Assignment)
- Integrated into `assignScheduleRecipe()`:
  - After assigning recipe to schedule slot, automatically calls `compareRecipeWithInventory()`
  - If shortages found, calls `addShortagesToShopping()` and shows `showToastWithAction`
  - Toast includes "買い物リストを確認" button that jumps to Mode A Shopping List tab

### Manual Trigger (Recipe Detail)
- Added "🛒 買い物へ" button in `#recipeModal` (next to Cancel and Save)
- Calls `addCurrentRecipeToShopping()` which:
  - Validates recipe is saved (has ID)
  - Runs `compareRecipeWithInventory()`
  - If no shortages, shows info toast
  - If shortages found, adds to shopping and shows action toast with jump button

### UI/UX
- `showToastWithAction(message, actionLabel, actionFn)`:
  - New reusable toast variant with embedded action button
  - Auto-dismisses after 8 seconds
  - Button click dismisses toast and executes callback

### Acceptance Criteria
- [x] 献立にレシピを割り当てると、不足材料が買い物リストに自動追記される
- [x] 買い物リストに既に同名・同単位の未購入アイテムがある場合、数量が加算される
- [x] 追記完了後、「買い物リストを確認」ボタンが表示される
- [x] ボタンをタップするとモードAの買い物リストタブに遷移する
- [x] レシピ詳細から「🛒 買い物リストに追加」ボタンで手動抽出もできる
- [x] HTML構文チェックが通る
- [x] `executeGAS` と `GAS_URL` が残っている
