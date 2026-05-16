# Report

Implemented the registration hub UI redesign for Mode A inventory management.

## Changed

- Header `+` opens the registration hub instead of the food input modal directly.
- Header now uses a three-tab UI: `食材管理`, `買い物リスト`, and `+`.
- Active tab colors change by screen: slate for inventory, emerald for shopping, amber for add.
- Only list area and row backgrounds follow the screen tone; header title and bottom actions stay neutral.
- Replaced scattered hidden controls with a shared `modePrimaryRow` / `modeSecondaryRow` / `modeSelectRow` frame.
- List start positions now align through equivalent control rows rather than a single fixed-height blank panel.
- Registration waiting count now appears on the header `+` badge.
- Storage tabs now show only real storage locations and the location manager.
- Registration hub top area contains shopping-list add actions only.
- Registration waiting has compact local sort controls for registration order, name, and expiry.
- Shopping list has local sort controls for name, quantity, and scheduled date.
- Shopping list confirmation moved to the header tab next to `+`.
- Registration waiting bottom actions are grouped as inventory-add operations.
- Manual add button label is `手動で追加`; the confirmation entrypoint is the header `買い物リスト` tab.

## Verify

- `VERIFY_PASSED`
