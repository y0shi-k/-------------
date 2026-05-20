# TKT-0069 Manual Smokes

Status: ready for user browser test

## Checked By Static Verification

- `getWeekDates(0)` returns 7 dates where the 4th item is today's local date.
- `getWeekDates(-1)` and `getWeekDates(1)` shift the centered range by 7 days.
- The central schedule navigation control calls `resetScheduleWeek()`.
- `resetScheduleWeek()` sets `state.scheduleWeekOffset = 0` and rerenders the schedule.
- `getScheduleWeekOffsetForDate(dateStr)` uses the today-centered range, so schedule-add navigation lands on a range containing the selected date.
- Today tone is evaluated before Saturday/Sunday tones, so today's highlight wins on weekends.
- No new Spreadsheet write path or immediate `executeGAS(payload...)` call was added.

## Browser/Canvas Checks Remaining

- Open Mode B > スケジュール and confirm the 4th date card is today.
- Tap 前の週 / 次の週 and confirm each range moves by exactly 7 days.
- Tap 今週 and confirm the range returns to today-centered.
- Confirm today is visually prominent, Saturday is blue, and Sunday is rose/red.
