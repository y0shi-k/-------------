# Review

No blocking code-review findings from static inspection.

## Checks

- `switchBTab()` now routes through `renderRecipeMode()` instead of hidden tab panels.
- `renderRecipeModeControls()` owns Mode B top controls; list renderers only fill `recipeListContainer`.
- Recipe create/update/history GAS column ranges were updated for the 9-column recipe schema.
- Recipe sorting is local UI state and does not introduce new GAS writes.
- The schedule-only vertical offset was caused by a stacked date heading inside each list card; schedule rows now place the date in a left column.
- The remaining schedule week-to-week visual drift was consistent with horizontal minimum-width expansion. Week navigation now constrains labels, and schedule slots now use a fixed 3-column grid with `min-w-0` slots.
- Week switching resets Mode B horizontal scroll offsets after rendering.
- Follow-up screenshots showed the drift only on the recipe-filled current week, so assigned recipe slots are now constrained at every ancestor level and document-level horizontal overflow is hidden.
- Empty schedule slots now reserve the same title/action rows as assigned slots, avoiding size and visual-position differences caused by content presence.

## Residual Risk

- Canvas visual preview is still needed to confirm the `今週` / `+1週` screenshots match exactly in the target environment.
- Existing duplicate IDs inside the AI preview modal were left untouched because they are outside this UI-frame ticket.
