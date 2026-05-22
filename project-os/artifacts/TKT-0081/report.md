# TKT-0081 Report

## Summary

Implemented the expiry use-up hub in `app.html`.

## Changes

- Added a `使い切り` system tab in food management.
- Added shared expiry derivation helpers based on `limit2 || limit1`.
- Added grouped display for expired, within 3 days, within 7 days, and unset expiry items.
- Added per-item actions for recipe ingredient search and existing AI priority-consumption flow.
- Added a top expiry summary to the cooking record home with a link to the use-up hub.

## Verification

- `VERIFY_PASSED`
- `JS_SYNTAX_PASSED`
- No `alert(` / `confirm(` / `prompt(` matches.
