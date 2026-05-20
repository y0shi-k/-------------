# TKT-0071 Report

status: ready

## Summary

Fixed the schedule D&D sync rollback bug and added a disabled spinner state to the top sync button.

## Changes

- Added `SPEC-0071-schedule-dnd-sync-button-lock` and `TKT-0071-schedule-dnd-sync-button-lock`.
- Updated the top sync button with `id="syncButton"`, spinner/label spans, `aria-busy`, and disabled styling.
- Added `updateSyncButtonState()` and wired it through `updateSyncBar()`.
- Updated `syncPendingChanges()` so sync start and finish refresh the button state.
- Updated GAS `scheduleUpdates` handling to write the full existing 8-column schedule row payload, including moved `date` and `meal`.
- Changed cooking completion schedule status updates to use `queueScheduleUpdate(scheduleItem)` so complete schedule payloads are queued.

## Verification

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# VERIFY_PASSED
```

Additional checks:

- No `alert(` / `confirm(` / `prompt(` matches.
- `showToast` remains present.
- No new per-operation GAS write path was added.
- Spreadsheet writes remain scoped to initialization and manual bulk sync.

## Manual Follow-Up

Canvas smoke should confirm D&D move/readback and the sync button spinner/disabled behavior against the live GAS endpoint.
