# TKT-0071 Manual Smokes

status: ready_for_user_canvas_smoke

## Static Smokes Completed

- [x] Standard HTML/GAS presence verify passed.
- [x] No `alert(` / `confirm(` / `prompt(` matches were found.
- [x] `showToast` remains present.
- [x] No new per-operation GAS write path was added.
- [x] Spreadsheet write scan shows writes remain in `handleInit()` / `syncPendingChanges()`.

## Canvas Smokes To Run

- [ ] Existing schedule card: drag it to another date, press the top `同期する` button, and confirm it remains on the destination date after sync completes.
- [ ] Existing schedule card: drag it from 朝 to 昼 or 晩, sync, and confirm it remains in the destination meal block.
- [ ] Same meal block: reorder multiple schedule cards, sync, and confirm the order remains stable.
- [ ] While sync is running, confirm the top button shows a spinner and `同期中`, and cannot be clicked again.
- [ ] If sync fails or times out, confirm unsynced changes remain visible and the button returns to `同期する`.

## Notes

Actual Spreadsheet readback requires the Gemini Canvas/GAS environment, so browser smoke is intentionally left for user execution.
