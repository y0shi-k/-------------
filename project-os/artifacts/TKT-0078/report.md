# TKT-0078 Report

## Summary

Implemented the Today dashboard at the top of mode C's normal cooking/record view.

## Changes

- Added derived dashboard data for today's unfinished schedule, expiring inventory, shopping summary, pending sync count, and local recipe candidates.
- Replaced the previous standalone expiry summary at the top of cooking records with the broader Today dashboard.
- Changed the post-initialization landing mode to mode C so the Today dashboard is shown immediately after app startup.
- Connected dashboard actions to existing navigation and viewer functions only.
- Preserved the existing three-item bottom navigation, GAS communication, Spreadsheet schema, and manual bulk sync flow.

## Verification

- Standard verify passed.
- JavaScript parse check passed.
- Static dialog check found no `alert`, `confirm`, or `prompt`.
- Static GAS check found no new dashboard write call.
