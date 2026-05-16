# Manual Smokes

- [x] HTML parser verify passed.
- [x] JavaScript syntax check passed.
- [x] `alert(` / `confirm(` / `prompt(` were not found.
- [x] No new individual GAS write call was added; `executeGAS` remains load/sync flows.
- [x] Mode B uses `recipeModeTopTabs`, `recipePrimaryRow`, `recipeSecondaryRow`, `recipeSelectRow`, and `recipeListContainer`.
- [x] レシピ集 has sort controls for 登録日時 / 更新日時 / レシピ名 / 調理回数 / 材料数.
- [x] AI考案 renders expiring inventory items in the shared list container.
- [x] スケジュール renders week navigation in the primary row and the week cards in the shared list container.
- [x] スケジュール day cards use a horizontal row layout so the meal slots start near the same vertical position as other list rows.
- [x] スケジュール week navigation uses `min-w-0`, `overflow-hidden`, and truncated labels so the right button is not clipped by text minimum widths.
- [x] スケジュール meal slots use a fixed 3-column grid with `min-w-0` slots so assigned recipe names and start buttons do not widen the row.
- [x] `changeScheduleWeek()` resets relevant horizontal scroll positions after re-rendering to avoid stale scroll offsets between weeks.
- [x] レシピ入りのスケジュール週でも、assigned slot / schedule card / list container / html-body の横overflowを抑止する。
- [x] スケジュールの空スロットもレシピ名行と操作行の枠を予約し、レシピありスロットと同じ幅・高さ・内部座標で表示する。
- [x] Mode B frame rows use fixed heights (`h-12`, `h-20`, `h-8`) to prevent tab-specific control growth.
- [x] レシピ集 GAS schema uses 登録日時 + 最終編集日時 without adding per-operation GAS calls.
- [ ] Canvas preview with real GAS communication is not run in this environment.

## Scenario Notes

- Existing recipe viewer, cooking, edit, and delete buttons remain on recipe rows.
- Existing AI generation modals and recipe save flow remain in place.
- Existing schedule assignment/change/delete flows remain local state + pendingSync based.
- Existing rows without 登録日時 use the old 最終編集日時 value as display-created time.
- Schedule sorting remains removed per user direction; schedule dates render in week order.
- The remaining observed drift was treated as recipe-filled schedule rows creating document-level horizontal scroll.
- Empty and assigned schedule slots now share a fixed three-row internal layout.
