# TKT-0069 Report

Status: report_ready

## Summary

Implemented today-centered 7-day schedule display. Offset 0 now shows today in the center, previous/next move by 7 days, and the center control resets to today-centered display.

## Changes

- Added `SPEC-0069-schedule-centered-week` and `TKT-0069-schedule-centered-week`.
- Updated schedule date generation to use local `YYYY-MM-DD` formatting instead of `toISOString()`.
- Added local date parsing and centered offset calculation for schedule-add navigation.
- Converted the center week label into a reset button.
- Added date-card tone logic for today, Saturday, Sunday, and weekdays.

## Verification

- Standard verify passed.
- `git diff --check` passed.
- Static centered-range check passed for the current date, 2026-05-20.

## Follow-Up

- Confirm final visual appearance in GeminiCanvas.
