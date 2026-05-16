# Report

Implemented Mode B shared-frame UI for 献立・レシピ.

## Changed

- Replaced Mode B tab panels with a shared `recipeModeTopTabs` / `recipePrimaryRow` / `recipeSecondaryRow` / `recipeSelectRow` / `recipeListContainer` structure.
- Added distinct tones for レシピ集, AI考案, and スケジュール.
- Added recipe collection sorting by 登録日時, 更新日時, レシピ名, 調理回数, and 材料数.
- Converted AI考案 into a list screen for expiring inventory items while keeping existing generation flows.
- Moved schedule week navigation into the shared primary row.
- Changed schedule day cards from stacked date-heading cards to horizontal rows, aligning meal-slot start position with the other Mode B lists.
- Fixed Mode B control row heights to prevent tab-specific content from shifting the list start.
- Fixed schedule horizontal overflow by adding shrink constraints to week navigation and rendering meal slots as a fixed 3-column grid.
- Hardened recipe-filled schedule rows by constraining assigned slot text, schedule cards, the list container, and global `html/body` horizontal overflow.
- Reserved the same title/action frame inside empty schedule slots so empty and assigned slots keep matching visual dimensions.
- Reset Mode B tab/primary horizontal scroll offsets when switching schedule weeks.
- Added a shared horizontal-scroll reset that preserves vertical scroll while clearing document and Mode B row/list scrollLeft values.
- Added `createdAt` / `updatedAt` to recipe state and updated the レシピ集 sheet schema to include 登録日時.
- Updated recipe create/update/history GAS ranges to match the new recipe columns.

## Verify

- `VERIFY_PASSED`
- JavaScript syntax check passed.
- Safety grep for `alert(` / `confirm(` / `prompt(` / `executeGAS(` reviewed.
