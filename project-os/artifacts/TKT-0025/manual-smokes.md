# Manual Smokes

- [x] HTML parser verify passed.
- [x] `alert(` / `confirm(` / `prompt(` were not found by `rg`.
- [x] `showToast` remains present.
- [x] `GEMINI_API_KEY` empty-value validation was not added.
- [x] No new individual Spreadsheet write path was added; existing `executeGAS` matches remain load/sync/API flows.
- [x] `modePrimaryRow` / `modeSecondaryRow` / `modeSelectRow` are the only Mode A subheader control rows.
- [x] Old `locationTabs`, `registrationHubControls`, `shoppingControls`, `sortControls`, and `listControls` containers were removed from the Mode A header.
- [x] Shopping list has sort controls for `名前順` / `数量順` / `予定日順`.
- [x] Add tab uses the same three-row frame and keeps `画像スキャン` / `手動で追加` in the primary row.
- [ ] Canvas preview with real GAS communication is not run in this environment.

## Scenario Notes

- Header `+` now routes to the registration hub via `openRegistrationHub()`.
- Header has `食材管理`, `買い物リスト`, and `+` as a three-tab UI.
- Active tab tone changes by screen: slate, emerald, and amber.
- Header title area and bottom action area stay neutral.
- Shopping-list area and rows use the same emerald tone.
- List start position is stabilized by a shared three-row controls frame under the header instead of a single fixed-height blank panel.
- Storage location tabs no longer render `登録待ち` or `買い物リスト`.
- Image scan and `手動で追加` entrypoints are shown as shopping-list add actions in the registration hub header area.
- Shopping list confirmation is reached from the header `買い物リスト` tab, not from inside the add screen.
- Shopping list sorting is local UI state only and does not call GAS.
