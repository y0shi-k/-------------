# Review

No blocking code-review findings from static inspection.

## Checks

- `renderList()` now delegates top controls to `renderModeControls()` and keeps list body rendering local to the current tab branch.
- Shopping sorting is performed against `state.shopping` in memory and does not introduce any new `executeGAS` write path.
- Staging sorting preserves original `state.staging` indexes for editor, delete, and checkbox actions.

## Residual Risk

- Visual spacing and interaction should be checked in Gemini Canvas, especially mobile-width wrapping of the three top action buttons.
- Existing shopping/inventory sync behavior was intentionally preserved and not reworked.
