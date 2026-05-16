# Manual Smokes

- [x] HTML parser verify passed.
- [x] JavaScript syntax check passed.
- [x] `alert(` / `confirm(` / `prompt(` were not found.
- [x] No new individual GAS write call was added; `executeGAS` remains load/sync flows.
- [x] Mode B uses `recipeModeTopTabs`, `recipePrimaryRow`, `recipeSecondaryRow`, `recipeSelectRow`, and `recipeListContainer`.
- [x] レシピ集 has sort controls for 登録日時 / 更新日時 / レシピ名 / 調理回数 / 材料数.
- [x] AI考案 renders expiring inventory items in the shared list container.
- [x] スケジュール renders week navigation in the primary row and the week cards in the shared list container.
- [x] レシピ集 GAS schema uses 登録日時 + 最終編集日時 without adding per-operation GAS calls.
- [ ] Canvas preview with real GAS communication is not run in this environment.

## Scenario Notes

- Existing recipe viewer, cooking, edit, and delete buttons remain on recipe rows.
- Existing AI generation modals and recipe save flow remain in place.
- Existing schedule assignment/change/delete flows remain local state + pendingSync based.
- Existing rows without 登録日時 use the old 最終編集日時 value as display-created time.
