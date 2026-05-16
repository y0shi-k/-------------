# Report

Implemented Mode B shared-frame UI for 献立・レシピ.

## Changed

- Replaced Mode B tab panels with a shared `recipeModeTopTabs` / `recipePrimaryRow` / `recipeSecondaryRow` / `recipeSelectRow` / `recipeListContainer` structure.
- Added distinct tones for レシピ集, AI考案, and スケジュール.
- Added recipe collection sorting by 登録日時, 更新日時, レシピ名, 調理回数, and 材料数.
- Converted AI考案 into a list screen for expiring inventory items while keeping existing generation flows.
- Moved schedule week navigation into the shared primary row and added schedule sorting controls.
- Added `createdAt` / `updatedAt` to recipe state and updated the レシピ集 sheet schema to include 登録日時.
- Updated recipe create/update/history GAS ranges to match the new recipe columns.

## Verify

- `VERIFY_PASSED`
- JavaScript syntax check passed.
